from pydantic import BaseModel
from typing import Dict

class RelevanceRequest(BaseModel):
    topic: str
    title: str
    description: str

class RelevanceResponse(BaseModel):
    topic: str
    title: str
    similarity_score: float
    relevant: bool
    model_scores: Dict[str, float] = None  # Optional field
