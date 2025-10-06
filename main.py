import asyncio
import os
import time
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List
import psycopg2
from psycopg2.extras import RealDictCursor

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from openai import AsyncOpenAI
from anthropic import AsyncAnthropic
from google import genai
import httpx

app = FastAPI()

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
gemini_client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

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
        
        # The newest Gemini model series is "gemini-2.5-flash" or "gemini-2.5-pro"
        # However for cost testing we use gemini-2.0-flash-exp as specified
        response = await asyncio.to_thread(
            gemini_client.models.generate_content,
            model=model,
            contents=TEST_PROMPT,
            config=genai.types.GenerateContentConfig(
                temperature=TEMPERATURE,
                max_output_tokens=MAX_TOKENS,
            )
        )
        
        latency = time.time() - start
        
        # Extract token counts from usage metadata
        in_tokens = response.usage_metadata.prompt_token_count if response.usage_metadata else 0
        out_tokens = response.usage_metadata.candidates_token_count if response.usage_metadata else 0
        
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


@app.get("/api/run-test")
async def run_test():
    """Run concurrent tests on all LLM models"""
    # Execute all tests concurrently using asyncio.gather
    results = await asyncio.gather(
        test_openai("gpt-4o-mini"),
        test_anthropic("claude-3-5-haiku-20241022"),
        test_gemini("gemini-2.0-flash-exp"),
        test_deepseek("deepseek-chat"),
        return_exceptions=True
    )
    
    # Filter out exceptions and insert into database
    valid_results = []
    for result in results:
        if isinstance(result, dict):
            valid_results.append(result)
            # Insert into database asynchronously
            await asyncio.to_thread(insert_result, result)
    
    return {"results": valid_results}


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
            history.append({
                "ts": row["ts"].isoformat(),
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


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
