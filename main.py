import asyncio
import os
import time
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List
import psycopg2
from psycopg2.extras import RealDictCursor

from fastapi import FastAPI, Query, Request
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from openai import AsyncOpenAI
from anthropic import AsyncAnthropic
import google.generativeai as genai
import httpx

app = FastAPI()

# Currency conversion cache (24 hour TTL)
_fx_cache = {"rate": None, "timestamp": None}
FX_CACHE_TTL_HOURS = 24

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize API clients
openai_client = AsyncOpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
anthropic_client = AsyncAnthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))
genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))

# Pricing table: cost per 1M tokens (input, output)
# Source: provider pricing pages as of Oct 2025
PRICING = {
    "gpt-4o-mini": {"input": 0.15, "output": 0.60, "provider": "OpenAI"},
    "claude-3-5-haiku-20241022": {"input": 0.80, "output": 4.00, "provider": "Anthropic"},
    "gemini-2.0-flash-exp": {"input": 0.00, "output": 0.00, "provider": "Google"},  # Free during preview
    "deepseek-chat": {"input": 0.14, "output": 0.28, "provider": "DeepSeek"},
}

# Model display names
MODEL_DISPLAY_NAMES = {
    "gpt-4o-mini": "GPT-4o Mini",
    "claude-3-5-haiku-20241022": "Claude 3.5 Haiku",
    "gemini-2.0-flash-exp": "Gemini 2.0 Flash",
    "deepseek-chat": "DeepSeek Chat",
}

# Standard test prompt (short to minimize costs)
TEST_PROMPT = "Explain quantum computing in exactly 50 words."
TEMPERATURE = 0.2
MAX_TOKENS = 100


def get_db_connection():
    """Get database connection using environment variables"""
    return psycopg2.connect(
        host=os.environ.get("PGHOST"),
        database=os.environ.get("PGDATABASE"),
        user=os.environ.get("PGUSER"),
        password=os.environ.get("PGPASSWORD"),
        port=os.environ.get("PGPORT"),
    )


def calc_cost(model: str, in_tokens: int, out_tokens: int) -> float:
    """Calculate cost in USD based on token usage"""
    if model not in PRICING:
        return 0.0
    
    pricing = PRICING[model]
    input_cost = (in_tokens / 1_000_000) * pricing["input"]
    output_cost = (out_tokens / 1_000_000) * pricing["output"]
    return input_cost + output_cost


async def get_usd_to_gbp_rate() -> float:
    """
    Get USD to GBP exchange rate from ExchangeRate-API.
    Caches result for 24 hours to stay within free tier limits.
    """
    global _fx_cache
    
    # Check cache validity
    if _fx_cache["rate"] and _fx_cache["timestamp"]:
        age = datetime.now() - _fx_cache["timestamp"]
        if age < timedelta(hours=FX_CACHE_TTL_HOURS):
            return _fx_cache["rate"]
    
    # Fetch fresh rate
    api_key = os.environ.get("EXCHANGERATE_API_KEY")
    if not api_key:
        print("Warning: EXCHANGERATE_API_KEY not set, using fallback rate 0.79")
        return 0.79  # Fallback rate
    
    try:
        url = f"https://v6.exchangerate-api.com/v6/{api_key}/pair/USD/GBP"
        async with httpx.AsyncClient() as client:
            response = await client.get(url, timeout=10.0)
            data = response.json()
            
            if data.get("result") == "success":
                rate = data.get("conversion_rate")
                # Update cache
                _fx_cache["rate"] = rate
                _fx_cache["timestamp"] = datetime.now()
                print(f"Fetched fresh USD/GBP rate: {rate}")
                return rate
            else:
                print(f"ExchangeRate-API error: {data.get('error-type', 'unknown')}")
                return 0.79  # Fallback
    except Exception as e:
        print(f"Error fetching exchange rate: {e}")
        return 0.79  # Fallback


async def convert_currency(amount_usd: float, target_currency: str) -> float:
    """Convert USD amount to target currency (GBP or USD)"""
    if target_currency == "USD":
        return amount_usd
    elif target_currency == "GBP":
        rate = await get_usd_to_gbp_rate()
        return amount_usd * rate
    else:
        return amount_usd  # Default to USD


async def test_openai(model: str = "gpt-4o-mini") -> Dict[str, Any]:
    """Test OpenAI model (GPT-4o Mini)"""
    try:
        start = time.time()
        
        # the newest OpenAI model is "gpt-5" which was released August 7, 2025.
        # However for cost testing we use gpt-4o-mini as specified
        response = await openai_client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": TEST_PROMPT}],
            temperature=TEMPERATURE,
            max_tokens=MAX_TOKENS,
        )
        
        latency = time.time() - start
        
        in_tokens = response.usage.prompt_tokens
        out_tokens = response.usage.completion_tokens
        total_tokens = response.usage.total_tokens
        
        tps = out_tokens / latency if latency > 0 else 0
        cost = calc_cost(model, in_tokens, out_tokens)
        
        return {
            "model": model,
            "provider": PRICING[model]["provider"],
            "display_name": MODEL_DISPLAY_NAMES[model],
            "latency_s": round(latency, 3),
            "tps": round(tps, 2),
            "cost_usd": round(cost, 6),
            "in_tokens": in_tokens,
            "out_tokens": out_tokens,
            "error": None,
        }
    except Exception as e:
        return {
            "model": model,
            "provider": PRICING[model]["provider"],
            "display_name": MODEL_DISPLAY_NAMES[model],
            "latency_s": None,
            "tps": None,
            "cost_usd": None,
            "in_tokens": None,
            "out_tokens": None,
            "error": str(e),
        }


async def test_anthropic(model: str = "claude-3-5-haiku-20241022") -> Dict[str, Any]:
    """Test Anthropic model (Claude 3.5 Haiku)"""
    try:
        start = time.time()
        
        # The newest Anthropic model is "claude-sonnet-4-20250514"
        # However for cost testing we use claude-3-5-haiku-20241022 as specified
        response = await anthropic_client.messages.create(
            model=model,
            max_tokens=MAX_TOKENS,
            temperature=TEMPERATURE,
            messages=[{"role": "user", "content": TEST_PROMPT}],
        )
        
        latency = time.time() - start
        
        in_tokens = response.usage.input_tokens
        out_tokens = response.usage.output_tokens
        
        tps = out_tokens / latency if latency > 0 else 0
        cost = calc_cost(model, in_tokens, out_tokens)
        
        return {
            "model": model,
            "provider": PRICING[model]["provider"],
            "display_name": MODEL_DISPLAY_NAMES[model],
            "latency_s": round(latency, 3),
            "tps": round(tps, 2),
            "cost_usd": round(cost, 6),
            "in_tokens": in_tokens,
            "out_tokens": out_tokens,
            "error": None,
        }
    except Exception as e:
        return {
            "model": model,
            "provider": PRICING[model]["provider"],
            "display_name": MODEL_DISPLAY_NAMES[model],
            "latency_s": None,
            "tps": None,
            "cost_usd": None,
            "in_tokens": None,
            "out_tokens": None,
            "error": str(e),
        }


async def test_gemini(model: str = "gemini-2.0-flash-exp") -> Dict[str, Any]:
    """Test Google Gemini model (Gemini 2.0 Flash)"""
    try:
        start = time.time()
        
        # Create model instance
        gemini_model = genai.GenerativeModel(model)
        
        # Generate content with specified parameters
        response = await asyncio.to_thread(
            gemini_model.generate_content,
            TEST_PROMPT,
            generation_config=genai.types.GenerationConfig(
                temperature=TEMPERATURE,
                max_output_tokens=MAX_TOKENS,
            )
        )
        
        latency = time.time() - start
        
        # Extract token counts from usage metadata
        in_tokens = response.usage_metadata.prompt_token_count if response.usage_metadata else 0
        
        # candidates_token_count can be a list or int, handle both cases
        candidates_count = response.usage_metadata.candidates_token_count if response.usage_metadata else 0
        out_tokens = candidates_count[0] if isinstance(candidates_count, list) and len(candidates_count) > 0 else (candidates_count if isinstance(candidates_count, int) else 0)
        
        tps = out_tokens / latency if latency > 0 and out_tokens else 0
        cost = calc_cost(model, in_tokens, out_tokens)
        
        return {
            "model": model,
            "provider": PRICING[model]["provider"],
            "display_name": MODEL_DISPLAY_NAMES[model],
            "latency_s": round(latency, 3),
            "tps": round(tps, 2),
            "cost_usd": round(cost, 6),
            "in_tokens": in_tokens,
            "out_tokens": out_tokens,
            "error": None,
        }
    except Exception as e:
        return {
            "model": model,
            "provider": PRICING[model]["provider"],
            "display_name": MODEL_DISPLAY_NAMES[model],
            "latency_s": None,
            "tps": None,
            "cost_usd": None,
            "in_tokens": None,
            "out_tokens": None,
            "error": str(e),
        }


async def test_deepseek(model: str = "deepseek-chat") -> Dict[str, Any]:
    """Test DeepSeek model (OpenAI-compatible API)"""
    try:
        start = time.time()
        
        # DeepSeek uses OpenAI-compatible API
        deepseek_client = AsyncOpenAI(
            api_key=os.environ.get("DEEPSEEK_API_KEY"),
            base_url="https://api.deepseek.com",
        )
        
        response = await deepseek_client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": TEST_PROMPT}],
            temperature=TEMPERATURE,
            max_tokens=MAX_TOKENS,
        )
        
        latency = time.time() - start
        
        in_tokens = response.usage.prompt_tokens
        out_tokens = response.usage.completion_tokens
        
        tps = out_tokens / latency if latency > 0 else 0
        cost = calc_cost(model, in_tokens, out_tokens)
        
        return {
            "model": model,
            "provider": PRICING[model]["provider"],
            "display_name": MODEL_DISPLAY_NAMES[model],
            "latency_s": round(latency, 3),
            "tps": round(tps, 2),
            "cost_usd": round(cost, 6),
            "in_tokens": in_tokens,
            "out_tokens": out_tokens,
            "error": None,
        }
    except Exception as e:
        return {
            "model": model,
            "provider": PRICING[model]["provider"],
            "display_name": MODEL_DISPLAY_NAMES[model],
            "latency_s": None,
            "tps": None,
            "cost_usd": None,
            "in_tokens": None,
            "out_tokens": None,
            "error": str(e),
        }


def insert_result(result: Dict[str, Any]) -> None:
    """Insert test result into database"""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute("""
            INSERT INTO results 
            (provider, model, latency_s, tps, cost_usd, in_tokens, out_tokens, error)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            result["provider"],
            result["model"],
            result["latency_s"],
            result["tps"],
            result["cost_usd"],
            result["in_tokens"],
            result["out_tokens"],
            result["error"],
        ))
        
        conn.commit()
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error inserting result: {e}")


@app.post("/api/run-test")
@app.get("/api/run-test")  # Keep GET for backwards compatibility
async def run_test(request: Request = None):
    """Run concurrent tests on selected LLM models with currency conversion"""
    # Parse request body for POST requests
    selected_models = None
    currency = "GBP"  # Default to GBP
    
    if request and request.method == "POST":
        try:
            body = await request.json()
            selected_models = body.get("models")
            currency = body.get("currency", "GBP")
        except:
            pass  # Use defaults if body parsing fails
    
    # Model test function mapping (don't call yet!)
    model_test_funcs = {
        "gpt-4o-mini": lambda: test_openai("gpt-4o-mini"),
        "claude-3-5-haiku-20241022": lambda: test_anthropic("claude-3-5-haiku-20241022"),
        "gemini-2.0-flash-exp": lambda: test_gemini("gemini-2.0-flash-exp"),
        "deepseek-chat": lambda: test_deepseek("deepseek-chat"),
    }
    
    # If specific models selected, only test those
    if selected_models:
        tests_to_run = [model_test_funcs[m]() for m in selected_models if m in model_test_funcs]
    else:
        tests_to_run = [func() for func in model_test_funcs.values()]
    
    # Execute tests concurrently
    results = await asyncio.gather(*tests_to_run, return_exceptions=True)
    
    # Filter out exceptions, add currency conversion, and insert into database
    valid_results = []
    for result in results:
        if isinstance(result, dict):
            # Add cost_gbp field
            if result.get("cost_usd") is not None:
                result["cost_gbp"] = round(await convert_currency(result["cost_usd"], "GBP"), 6)
            else:
                result["cost_gbp"] = None
            
            valid_results.append(result)
            # Insert into database asynchronously
            await asyncio.to_thread(insert_result, result)
    
    return {"results": valid_results, "currency": currency}


@app.get("/api/history")
async def get_history(
    model: Optional[str] = Query(None, description="Filter by model name"),
    range: str = Query("24h", description="Time range: 24h, 7d, or 30d")
):
    """Get historical test results with optional filtering"""
    try:
        # Calculate time threshold
        now = datetime.now()
        if range == "24h":
            threshold = now - timedelta(hours=24)
        elif range == "7d":
            threshold = now - timedelta(days=7)
        elif range == "30d":
            threshold = now - timedelta(days=30)
        else:
            threshold = now - timedelta(hours=24)  # default to 24h
        
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        if model:
            cur.execute("""
                SELECT ts, provider, model, latency_s, tps, cost_usd, 
                       in_tokens, out_tokens, error
                FROM results
                WHERE model = %s AND ts >= %s AND error IS NULL
                ORDER BY ts DESC
            """, (model, threshold))
        else:
            cur.execute("""
                SELECT ts, provider, model, latency_s, tps, cost_usd, 
                       in_tokens, out_tokens, error
                FROM results
                WHERE ts >= %s AND error IS NULL
                ORDER BY ts DESC
            """, (threshold,))
        
        rows = cur.fetchall()
        cur.close()
        conn.close()
        
        # Convert to list of dicts with proper formatting
        history = []
        for row in rows:
            # Convert timestamp to epoch milliseconds for charts
            ts_ms = int(row["ts"].timestamp() * 1000) if row["ts"] else None
            
            history.append({
                "ts_ms": ts_ms,
                "provider": row["provider"],
                "model": row["model"],
                "latency_s": float(row["latency_s"]) if row["latency_s"] else None,
                "tps": float(row["tps"]) if row["tps"] else None,
                "cost_usd": float(row["cost_usd"]) if row["cost_usd"] else None,
                "in_tokens": row["in_tokens"],
                "out_tokens": row["out_tokens"],
            })
        
        return {"history": history, "range": range, "model": model}
        
    except Exception as e:
        return {"error": str(e), "history": []}


@app.post("/api/alerts/test")
async def test_alert(request: Request):
    """
    Test alert configuration against recent metrics to see if it would trigger.
    Returns evaluation result without creating an alert.
    """
    try:
        body = await request.json()
        alert_type = body.get("type")
        model = body.get("model")
        threshold = body.get("threshold")
        window = body.get("window", "24h")
        
        # Validate required fields
        if not alert_type:
            return {"error": "Alert type is required", "would_trigger": False}
        
        # Calculate time threshold
        now = datetime.now()
        if window == "24h":
            time_threshold = now - timedelta(hours=24)
        elif window == "7d":
            time_threshold = now - timedelta(days=7)
        else:
            time_threshold = now - timedelta(hours=24)
        
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # Query recent metrics based on alert configuration
        if model:
            cur.execute("""
                SELECT ts, model, latency_s, tps, cost_usd, in_tokens, out_tokens, error
                FROM results
                WHERE model = %s AND ts >= %s
                ORDER BY ts DESC
                LIMIT 100
            """, (model, time_threshold))
        else:
            cur.execute("""
                SELECT ts, model, latency_s, tps, cost_usd, in_tokens, out_tokens, error
                FROM results
                WHERE ts >= %s
                ORDER BY ts DESC
                LIMIT 100
            """, (time_threshold,))
        
        rows = cur.fetchall()
        cur.close()
        conn.close()
        
        if not rows:
            return {
                "would_trigger": False,
                "reason": "No recent data available for evaluation",
                "data_points": 0,
            }
        
        # Evaluate alert condition based on type
        would_trigger = False
        trigger_details = {}
        
        if alert_type == "latency" and threshold:
            try:
                threshold_val = float(threshold)
            except (ValueError, TypeError):
                return {"error": "Invalid threshold value for latency alert", "would_trigger": False}
            max_latency = max((r["latency_s"] or 0) for r in rows)
            would_trigger = max_latency > threshold_val
            trigger_details = {
                "max_latency": round(max_latency, 3),
                "threshold": threshold_val,
                "comparison": f"{max_latency:.3f}s > {threshold_val}s"
            }
        
        elif alert_type == "tps_drop" and threshold:
            try:
                threshold_val = float(threshold)
            except (ValueError, TypeError):
                return {"error": "Invalid threshold value for tps_drop alert", "would_trigger": False}
            # Calculate average TPS and check for drops
            valid_tps = [r["tps"] for r in rows if r["tps"] is not None]
            if valid_tps:
                avg_tps = sum(valid_tps) / len(valid_tps)
                min_tps = min(valid_tps)
                drop_percent = ((avg_tps - min_tps) / avg_tps * 100) if avg_tps > 0 else 0
                would_trigger = drop_percent > threshold_val
                trigger_details = {
                    "avg_tps": round(avg_tps, 2),
                    "min_tps": round(min_tps, 2),
                    "drop_percent": round(drop_percent, 2),
                    "threshold": threshold_val,
                    "comparison": f"{drop_percent:.2f}% > {threshold_val}%"
                }
        
        elif alert_type == "cost_mtok" and threshold:
            try:
                threshold_val = float(threshold)
            except (ValueError, TypeError):
                return {"error": "Invalid threshold value for cost_mtok alert", "would_trigger": False}
            # Calculate cost per million tokens
            costs = []
            for r in rows:
                if r["cost_usd"] and r["in_tokens"] and r["out_tokens"]:
                    total_tokens = r["in_tokens"] + r["out_tokens"]
                    if total_tokens > 0:
                        cost_per_mtok = (r["cost_usd"] / total_tokens) * 1_000_000
                        costs.append(cost_per_mtok)
            
            if costs:
                max_cost_mtok = max(costs)
                would_trigger = max_cost_mtok > threshold_val
                trigger_details = {
                    "max_cost_per_mtok": round(max_cost_mtok, 2),
                    "threshold": threshold_val,
                    "comparison": f"${max_cost_mtok:.2f} > ${threshold_val}"
                }
        
        elif alert_type == "error":
            # Check if there are any errors in the window
            error_count = sum(1 for r in rows if r["error"] is not None)
            would_trigger = error_count > 0
            trigger_details = {
                "error_count": error_count,
                "total_requests": len(rows),
                "error_rate": round((error_count / len(rows) * 100), 2) if rows else 0
            }
        
        elif alert_type == "digest":
            # Digest always triggers (it's a summary)
            would_trigger = True
            trigger_details = {
                "data_points": len(rows),
                "models_tested": len(set(r["model"] for r in rows)),
                "time_window": window
            }
        
        return {
            "would_trigger": would_trigger,
            "alert_type": alert_type,
            "data_points": len(rows),
            "window": window,
            "details": trigger_details,
        }
        
    except Exception as e:
        return {"error": str(e), "would_trigger": False}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
