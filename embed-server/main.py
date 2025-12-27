from fastapi import FastAPI
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
from sarvamai import SarvamAI
import json, re
from typing import List

app = FastAPI(title="Embedding + Evaluation Server")

embed_model = SentenceTransformer("sentence-transformers/all-mpnet-base-v2")

class TextIn(BaseModel):
    text: str

@app.post("/embed")
def embed_text(payload: TextIn):
    embedding = embed_model.encode(payload.text)
    return {
        "embedding": embedding.tolist(),
        "length": len(embedding)
    }

class TextIn(BaseModel):
    text: str

sarvam = SarvamAI(
    api_subscription_key="sk_4xsa20dp_GnEyVF5e8Hat97Lricexx4CG"
)

def extract_json(text: str):
    match = re.search(r"\{.*\}", text, re.S)
    if not match:
        raise ValueError("No JSON found in model output")
    return json.loads(match.group())

class EvalInput(BaseModel):
    prompt: str
    qualities: List[str]
    logs: List[str]
    specs: List[str]
    outliers: List[str]

class EvalScores(BaseModel):
    conversation_quality: float
    goal_completion: float
    compliance: float

class Recommendations(BaseModel):
    add_qualities: List[str]
    add_specs: List[str]
    add_outliers: List[str]

class EvalOutput(BaseModel):
    scores: EvalScores
    recommendations: Recommendations

SYSTEM_EVAL_PROMPT = """
            You are an automated conversation evaluation and improvement system.

            Internally:
            1. Act as a STRICT TEACHER to assess failures and risks
            2. Act as a STUDENT to produce final scores and improvements

            IMPORTANT:
            - All reasoning must remain internal
            - DO NOT reveal chain-of-thought
            - DO NOT explain reasoning
            - ONLY output the JSON specified

            ====================
            SCORING AXES
            ====================
            - conversation_quality
            - goal_completion
            - compliance

            Rules:
            - Scores must be floats between 0 and 1
            - Penalize violations of specs or outliers heavily
            - Be conservative and realistic

            ====================
            IMPROVEMENTS
            ====================
            Suggest ONLY additions that would have improved outcomes.

            ====================
            OUTPUT FORMAT (JSON ONLY)
            ====================
            {
            "scores": {
                "conversation_quality": float,
                "goal_completion": float,
                "compliance": float
            },
            "recommendations": {
                "add_qualities": [string],
                "add_specs": [string],
                "add_outliers": [string]
            }
            }
"""

# =========================================================
# Evaluate Endpoint (PURE JUDGE)
# =========================================================
@app.post("/evaluate", response_model=EvalOutput)
def evaluate(payload: EvalInput):
    messages = [
        {"role": "system", "content": SYSTEM_EVAL_PROMPT},
            {
                "role": "user",
                "content": f"""
            SYSTEM PROMPT:
            {payload.prompt}

            QUALITIES:
            - {"; ".join(payload.qualities)}

            SPECS:
            - {"; ".join(payload.specs)}

            OUTLIERS:
            - {"; ".join(payload.outliers)}

            CONVERSATION LOGS:
            {payload.logs}
            """
        }
    ]

    response = sarvam.chat.completions(messages=messages)
    raw_text = response.choices[0].message.content

    parsed = extract_json(raw_text)

    return {
        "scores": parsed["scores"],
        "recommendations": parsed["recommendations"]
    }

class BootstrapInput(BaseModel):
    description: str
    logs: List[str]

class BootstrapOutput(BaseModel):
    category: str
    useCase: str
    qualities: List[str]
    specs: List[str]
    convRate: float
    outliers: List[str]

BOOTSTRAP_PROMPT = """
        You are creating a NEW conversational knowledge base entry.

        Given:
        - a short description of the use case
        - example conversation logs

        You must produce a KB entry with:

        1. category:
        - ONE word only (examples: finance, healthcare, retail, telecom)

        2. useCase:
        - EXACTLY 3 words
        - descriptive and specific

        3. qualities:
        - behavioral traits the agent should follow

        4. specs:
        - rules in the form "If <condition> then <action>"

        5. outliers:
        - safety constraints / forbidden behaviors

        6. convRate:
        - initial confidence score between 0.0 and 1.0
        - default to 0.0 for new entries

        IMPORTANT:
        - Be conservative
        - Focus on safety and clarity
        - Output ONLY valid JSON

        ====================
        OUTPUT FORMAT (JSON ONLY)
        ====================
        {
        "category": string,
        "useCase": string,
        "qualities": [string],
        "specs": [string],
        "convRate": float,
        "outliers": [string]
        }
        """

        @app.post("/bootstrap", response_model=BootstrapOutput)
        def bootstrap_use_case(payload: BootstrapInput):
            messages = [
                {"role": "system", "content": BOOTSTRAP_PROMPT},
                {
                    "role": "user",
                    "content": f"""
        USE CASE DESCRIPTION:
        {payload.description}

        CONVERSATION LOGS:
        {payload.logs}
        """
        }
    ]

    response = sarvam.chat.completions(messages=messages)
    raw_text = response.choices[0].message.content

    parsed = extract_json(raw_text)

    return {
        "category": parsed["category"],
        "useCase": parsed["useCase"],
        "qualities": parsed["qualities"],
        "specs": parsed["specs"],
        "convRate": parsed.get("convRate", 0.0),
        "outliers": parsed["outliers"]
    }
