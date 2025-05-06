import os
from fastapi import FastAPI
from app.model import get_ensemble_score
from app.schemas import RelevanceRequest, RelevanceResponse
from prometheus_fastapi_instrumentator import Instrumentator
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI()

# 🚨 Add this block
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # You can later restrict to your extension ID
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Prometheus instrumentation
Instrumentator().instrument(app).expose(app)

@app.post("/check-relevance", response_model=RelevanceResponse)
def check_relevance(payload: RelevanceRequest):
    avg_score, model_scores = get_ensemble_score(
        payload.topic,
        payload.title,
        payload.description
    )
    return RelevanceResponse(
        topic=payload.topic,
        title=payload.title,
        similarity_score=avg_score,
        relevant=avg_score >= 0.6,
        model_scores=model_scores
    )

# Optional debug logging to confirm the app is running
@app.on_event("startup")
def startup_event():
    print("🚀 FastAPI app has started and is ready.")

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8080))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port)
