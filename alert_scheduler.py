#!/usr/bin/env python3
"""
Alert Scheduler - Evaluates active alerts and sends email notifications
Run via: python alert_scheduler.py --cron <CRON_TOKEN>
"""

import os
import sys
import argparse
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
import psycopg2
import psycopg2.extras
from psycopg2.extras import RealDictCursor
import sib_api_v3_sdk
from sib_api_v3_sdk.rest import ApiException

# Cadence to minutes mapping
CADENCE_MINUTES = {
    '5m': 5,
    '15m': 15,
    '1h': 60,
    '4h': 240,
    '12h': 720,
    '24h': 1440,
}

# Alert type labels
ALERT_TYPE_LABELS = {
    'latency': 'High Latency',
    'tps_drop': 'TPS Drop',
    'cost_mtok': 'Cost per MTok',
    'error': 'Errors Detected',
    'digest': 'Performance Digest',
}


def get_db_connection():
    """Get database connection using environment variables"""
    return psycopg2.connect(
        host=os.environ.get("PGHOST"),
        database=os.environ.get("PGDATABASE"),
        user=os.environ.get("PGUSER"),
        password=os.environ.get("PGPASSWORD"),
        port=os.environ.get("PGPORT"),
    )


def get_active_alerts() -> List[Dict[str, Any]]:
    """Fetch all active alerts from the database"""
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    cur.execute("""
        SELECT a.id, a.user_id, a.type, a.model, a.threshold, a.window, a.cadence,
               u.email as user_email
        FROM alerts a
        JOIN users u ON a.user_id = u.id
        WHERE a.active = true
        ORDER BY a.id
    """)
    
    alerts = cur.fetchall()
    cur.close()
    conn.close()
    
    return [dict(alert) for alert in alerts]


def check_cadence(alert_id: int, user_id: int, cadence: str) -> bool:
    """Check if enough time has passed since last email for this alert"""
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    minutes = CADENCE_MINUTES.get(cadence, 60)
    threshold_time = datetime.now() - timedelta(minutes=minutes)
    
    cur.execute("""
        SELECT id, sent_at
        FROM email_events
        WHERE user_id = %s AND alert_id = %s AND sent_at >= %s
        ORDER BY sent_at DESC
        LIMIT 1
    """, (user_id, alert_id, threshold_time))
    
    result = cur.fetchone()
    cur.close()
    conn.close()
    
    # If no recent email found, cadence check passes
    return result is None


def is_quiet_hours(user_id: int) -> bool:
    """Check if current time falls within user's quiet hours"""
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    cur.execute("""
        SELECT quiet_hours
        FROM user_settings
        WHERE user_id = %s
    """, (user_id,))
    
    result = cur.fetchone()
    cur.close()
    conn.close()
    
    if not result or not result.get('quiet_hours'):
        return False
    
    quiet_hours = result['quiet_hours']
    if not isinstance(quiet_hours, dict):
        return False
    
    start = quiet_hours.get('start')
    end = quiet_hours.get('end')
    
    if not start or not end:
        return False
    
    now = datetime.now().time()
    
    # Parse time strings (format: "HH:MM")
    try:
        start_time = datetime.strptime(start, "%H:%M").time()
        end_time = datetime.strptime(end, "%H:%M").time()
        
        # Handle overnight quiet hours (e.g., 22:00 to 08:00)
        if start_time <= end_time:
            return start_time <= now <= end_time
        else:
            return now >= start_time or now <= end_time
    except:
        return False


def get_recent_metrics(model: Optional[str], window: str) -> List[Dict[str, Any]]:
    """Get recent metrics for alert evaluation"""
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    # Calculate time threshold
    if window == '7d':
        threshold = datetime.now() - timedelta(days=7)
    else:  # '24h' or default
        threshold = datetime.now() - timedelta(hours=24)
    
    if model:
        cur.execute("""
            SELECT ts, model, latency_s, tps, cost_usd, in_tokens, out_tokens, error
            FROM results
            WHERE model = %s AND ts >= %s
            ORDER BY ts DESC
            LIMIT 100
        """, (model, threshold))
    else:
        cur.execute("""
            SELECT ts, model, latency_s, tps, cost_usd, in_tokens, out_tokens, error
            FROM results
            WHERE ts >= %s
            ORDER BY ts DESC
            LIMIT 100
        """, (threshold,))
    
    rows = cur.fetchall()
    cur.close()
    conn.close()
    
    return [dict(row) for row in rows]


def evaluate_alert(alert: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Evaluate if an alert should trigger based on recent metrics"""
    alert_type = alert['type']
    model = alert['model']
    threshold = alert['threshold']
    window = alert['window'] or '24h'
    
    metrics = get_recent_metrics(model, window)
    
    if not metrics:
        return None
    
    # Evaluate based on alert type
    if alert_type == 'latency' and threshold:
        threshold_val = float(threshold)
        max_latency = max((m['latency_s'] or 0) for m in metrics)
        
        if max_latency > threshold_val:
            return {
                'triggered': True,
                'metric': 'Latency',
                'value': f"{max_latency:.3f}s",
                'threshold': f"{threshold_val}s",
                'comparison': f"{max_latency:.3f}s > {threshold_val}s"
            }
    
    elif alert_type == 'tps_drop' and threshold:
        threshold_val = float(threshold)
        valid_tps = [m['tps'] for m in metrics if m['tps'] is not None]
        
        if valid_tps:
            avg_tps = sum(valid_tps) / len(valid_tps)
            min_tps = min(valid_tps)
            drop_percent = ((avg_tps - min_tps) / avg_tps * 100) if avg_tps > 0 else 0
            
            if drop_percent > threshold_val:
                return {
                    'triggered': True,
                    'metric': 'TPS Drop',
                    'value': f"{drop_percent:.2f}%",
                    'threshold': f"{threshold_val}%",
                    'comparison': f"{drop_percent:.2f}% > {threshold_val}%"
                }
    
    elif alert_type == 'cost_mtok' and threshold:
        threshold_val = float(threshold)
        costs = []
        
        for m in metrics:
            if m['cost_usd'] and m['in_tokens'] and m['out_tokens']:
                total_tokens = m['in_tokens'] + m['out_tokens']
                if total_tokens > 0:
                    cost_per_mtok = (m['cost_usd'] / total_tokens) * 1_000_000
                    costs.append(cost_per_mtok)
        
        if costs:
            max_cost_mtok = max(costs)
            
            if max_cost_mtok > threshold_val:
                return {
                    'triggered': True,
                    'metric': 'Cost per Million Tokens',
                    'value': f"${max_cost_mtok:.2f}",
                    'threshold': f"${threshold_val}",
                    'comparison': f"${max_cost_mtok:.2f} > ${threshold_val}"
                }
    
    elif alert_type == 'error':
        error_count = sum(1 for m in metrics if m['error'] is not None)
        
        if error_count > 0:
            return {
                'triggered': True,
                'metric': 'Errors',
                'value': f"{error_count} error(s)",
                'threshold': 'Any errors',
                'comparison': f"{error_count} error(s) detected"
            }
    
    elif alert_type == 'digest':
        # Digest always triggers (it's a summary)
        return {
            'triggered': True,
            'metric': 'Performance Summary',
            'value': f"{len(metrics)} data points",
            'threshold': 'N/A',
            'comparison': f"{len(metrics)} tests in {window} window"
        }
    
    return None


def send_alert_email(alert: Dict[str, Any], evaluation: Dict[str, Any]):
    """Send alert email via Brevo"""
    configuration = sib_api_v3_sdk.Configuration()
    configuration.api_key['api-key'] = os.environ.get('BREVO_API_KEY')
    
    api_instance = sib_api_v3_sdk.TransactionalEmailsApi(sib_api_v3_sdk.ApiClient(configuration))
    
    alert_label = ALERT_TYPE_LABELS.get(alert['type'], alert['type'])
    model_name = alert['model'] or 'All Models'
    
    subject = f"⚠️ Alert: {alert_label}"
    if alert['type'] != 'digest':
        subject += f" for {model_name}"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }}
          .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
          .alert {{ background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; margin: 20px 0; }}
          .digest {{ background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 16px; margin: 20px 0; }}
          .metric {{ background-color: #f9fafb; padding: 12px; border-radius: 6px; margin: 10px 0; }}
          .button {{ display: inline-block; padding: 12px 24px; background-color: #10b981; color: white; text-decoration: none; border-radius: 6px; font-weight: 500; }}
        </style>
      </head>
      <body>
        <div class="container">
          <h1>{'📊 Performance Digest' if alert['type'] == 'digest' else '🚨 Alert Triggered'}</h1>
          <div class="{'digest' if alert['type'] == 'digest' else 'alert'}">
            <strong>{alert_label}</strong> for <strong>{model_name}</strong>
          </div>
          <div class="metric">
            <p><strong>Metric:</strong> {evaluation['metric']}</p>
            <p><strong>Current Value:</strong> {evaluation['value']}</p>
            <p><strong>Threshold:</strong> {evaluation['threshold']}</p>
            <p><strong>Time:</strong> {datetime.now().strftime('%Y-%m-%d %H:%M:%S UTC')}</p>
          </div>
          <p style="margin: 30px 0;">
            <a href="{os.environ.get('APP_BASE_URL', 'http://localhost:5000')}/dashboard" class="button">View Dashboard</a>
          </p>
        </div>
      </body>
    </html>
    """
    
    send_smtp_email = sib_api_v3_sdk.SendSmtpEmail(
        to=[{"email": alert['user_email']}],
        sender={"name": "Optaimi Pulse", "email": "pulse@optaimi.com"},
        subject=subject,
        html_content=html_content
    )
    
    try:
        api_response = api_instance.send_transac_email(send_smtp_email)
        print(f"Alert email sent to {alert['user_email']}: {api_response}")
        return True
    except ApiException as e:
        print(f"Error sending alert email: {e}")
        return False


def log_email_event(user_id: int, alert_id: int, status: str, payload: Dict[str, Any]):
    """Log email event to database"""
    conn = get_db_connection()
    cur = conn.cursor()
    
    cur.execute("""
        INSERT INTO email_events (user_id, alert_id, status, payload)
        VALUES (%s, %s, %s, %s)
    """, (user_id, alert_id, status, psycopg2.extras.Json(payload)))
    
    conn.commit()
    cur.close()
    conn.close()


def run_scheduler():
    """Main scheduler logic - evaluate all active alerts"""
    print(f"[{datetime.now()}] Running alert scheduler...")
    
    alerts = get_active_alerts()
    print(f"Found {len(alerts)} active alert(s)")
    
    for alert in alerts:
        try:
            alert_id = alert['id']
            user_id = alert['user_id']
            cadence = alert['cadence']
            
            # Check cadence - skip if email sent recently
            if not check_cadence(alert_id, user_id, cadence):
                print(f"  Alert {alert_id}: Skipping (cadence not met)")
                continue
            
            # Check quiet hours
            if is_quiet_hours(user_id):
                print(f"  Alert {alert_id}: Skipping (quiet hours)")
                continue
            
            # Evaluate alert condition
            evaluation = evaluate_alert(alert)
            
            if evaluation and evaluation.get('triggered'):
                print(f"  Alert {alert_id}: TRIGGERED - {evaluation['comparison']}")
                
                # Send email
                success = send_alert_email(alert, evaluation)
                
                # Log event
                log_email_event(
                    user_id=user_id,
                    alert_id=alert_id,
                    status='sent' if success else 'failed',
                    payload={
                        'alert_type': alert['type'],
                        'model': alert['model'],
                        'evaluation': evaluation,
                        'timestamp': datetime.now().isoformat()
                    }
                )
                
                if success:
                    print(f"  Alert {alert_id}: Email sent to {alert['user_email']}")
                else:
                    print(f"  Alert {alert_id}: Email failed to send")
            else:
                print(f"  Alert {alert_id}: Not triggered")
                
        except Exception as e:
            print(f"  Alert {alert.get('id', 'unknown')}: Error - {e}")
    
    print(f"[{datetime.now()}] Scheduler run complete\n")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Alert Scheduler')
    parser.add_argument('--cron', help='Cron token for authentication', required=True)
    args = parser.parse_args()
    
    # Verify CRON_TOKEN
    expected_token = os.environ.get('CRON_TOKEN')
    if not expected_token:
        print("Error: CRON_TOKEN environment variable not set")
        sys.exit(1)
    
    if args.cron != expected_token:
        print("Error: Invalid CRON_TOKEN")
        sys.exit(1)
    
    run_scheduler()
