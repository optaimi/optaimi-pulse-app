#!/usr/bin/env python3
"""
Scheduler script for running LLM performance tests periodically.
This script is designed to be run by Replit's Scheduled Deployment feature.
"""
import asyncio
import sys
from main import (
    test_openai,
    test_anthropic,
    test_gemini,
    test_deepseek,
    insert_result,
)


async def run_scheduled_tests():
    """Run all LLM tests and insert results into database"""
    print("Starting scheduled LLM performance tests...")
    
    try:
        # Execute all tests concurrently
        results = await asyncio.gather(
            test_openai("gpt-4o-mini"),
            test_anthropic("claude-3-5-haiku-20241022"),
            test_gemini("gemini-2.0-flash-exp"),
            test_deepseek("deepseek-chat"),
            return_exceptions=True
        )
        
        # Process and insert results
        success_count = 0
        error_count = 0
        
        for result in results:
            if isinstance(result, dict):
                if result.get("error"):
                    error_count += 1
                    print(f"Error testing {result['display_name']}: {result['error']}")
                else:
                    success_count += 1
                    print(f"✓ {result['display_name']}: {result['latency_s']}s, "
                          f"{result['tps']} tok/s, ${result['cost_usd']}")
                
                # Insert into database
                await asyncio.to_thread(insert_result, result)
            else:
                error_count += 1
                print(f"Unexpected error: {result}")
        
        print(f"\nCompleted: {success_count} successful, {error_count} errors")
        return success_count > 0
        
    except Exception as e:
        print(f"Fatal error during scheduled tests: {e}")
        return False


if __name__ == "__main__":
    # Run the async tests
    success = asyncio.run(run_scheduled_tests())
    
    # Exit with appropriate code
    sys.exit(0 if success else 1)
