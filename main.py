from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

app = FastAPI()

# Configure CORS to allow the frontend to communicate with this server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

@app.get("/api/run-test")
def run_test():
    # Placeholder: In the future, this will call the LLM APIs
    mock_data = [
      {'name': 'gpt-5', 'latency': '480 ms', 'tps': '95', 'cost': '$1.25'},
      {'name': 'gpt-5-mini', 'latency': '200 ms', 'tps': '210', 'cost': '$0.25'},
      {'name': 'gpt-4o', 'latency': '550 ms', 'tps': '80', 'cost': '$2.50'},
      {'name': 'gpt-realtime', 'latency': '90 ms', 'tps': '450', 'cost': '$4.00'},
      {'name': 'Claude Sonnet 4.5', 'latency': '400 ms', 'tps': '100', 'cost': '$3.00'},
      {'name': 'Claude Haiku 3.5', 'latency': '150 ms', 'tps': '280', 'cost': '$0.80'},
      {'name': 'Gemini 2.5 Pro', 'latency': '500 ms', 'tps': '90', 'cost': '$2.00'},
      {'name': 'DeepSeek-V3.2-Exp', 'latency': '180 ms', 'tps': '250', 'cost': '$0.14'},
    ]
    return {"results": mock_data}

# This part is for running the server in a development environment
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)