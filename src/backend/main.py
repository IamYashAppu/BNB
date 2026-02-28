import os
import json
from google import genai
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class IntentRequest(BaseModel):
    user_message: str

@app.post("/parse-intent")
async def parse_intent(request: IntentRequest):
    # We use a highly structured prompt to force the exact keys
    prompt = f"""
    You are OmniYield, an advanced DeFi Delta-Neutral Yield Advisor.
    Your goal is to help users find safe, delta-neutral yield across different mock protocols on the BSC network.
    
    You MUST output ONLY a raw JSON object (no markdown, no formatting).
    Determine the user's intent from their message and format the JSON based on one of these three states:
    
    STATE 1: "exploration" (User is asking for options, safety, or yield)
    - Output fake but realistic delta-neutral market data.
    {{
        "type": "exploration",
        "message": "Here are the top delta-neutral strategies I found across the networks:",
        "data": [
            {{"protocol": "PancakeSwap", "pool": "USDT/USDC", "apy": "8.5%", "risk": "Low"}},
            {{"protocol": "Venus", "pool": "Lend USDT", "apy": "5.2%", "risk": "Very Low"}},
            {{"protocol": "Kinza", "pool": "USDT/FDUSD", "apy": "11.1%", "risk": "Medium"}}
        ]
    }}
    
    STATE 2: "execution" (User specified an amount and a protocol/strategy)
    {{
        "type": "execution",
        "message": "Excellent choice. Here is the transaction breakdown for your approval:",
        "transaction": {{"amount": <number>, "asset": "<string>", "protocol": "<string>", "action": "deposit"}}
    }}
    
    STATE 3: "clarification" (You need more info, like how much they want to invest)
    {{
        "type": "clarification",
        "message": "I can help with that. How much USDT were you looking to allocate?"
    }}
    
    User Message: "{request.user_message}"
    """
    
    # Use the Gemma 3 model
    response = client.models.generate_content(
        model='gemma-3-27b-it',
        contents=prompt
    )
    
    # Strip away any markdown formatting just in case the AI disobeys
    raw_text = response.text.replace('```json', '').replace('```', '').strip()
    
    # Convert the string into a real Python dictionary
    try:
        parsed_data = json.loads(raw_text)
    except json.JSONDecodeError:
        # Fallback if the AI really messes up the formatting
        parsed_data = {"error": "Failed to parse AI output", "raw": raw_text}
        
    return {
        "status": "success", 
        "data": parsed_data
    }
