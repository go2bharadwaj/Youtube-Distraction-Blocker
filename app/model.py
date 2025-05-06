# from sentence_transformers import SentenceTransformer, util
#
# model = SentenceTransformer('all-MiniLM-L6-v2')
#
# def get_relevance_score(topic: str, title: str, description: str) -> float:
#     video_text = f"{title}. {description}"
#     embeddings = model.encode([topic, video_text], convert_to_tensor=True)
#     score = util.pytorch_cos_sim(embeddings[0], embeddings[1]).item()
#     return round(score, 4)

# from sentence_transformers import SentenceTransformer, util
#
# # Load BGE model (highly recommended for semantic search/relevance)
# model = SentenceTransformer("BAAI/bge-small-en")

# def get_relevance_score(topic: str, title: str, description: str) -> float:
#     video_text = f"{title}. {description}"
#     # Optional: Add "query:" / "passage:" prefixes for better performance
#     topic_text = f"query: {topic}"
#     video_text = f"passage: {video_text}"
#
#     embeddings = model.encode([topic_text, video_text], convert_to_tensor=True)
#     score = util.pytorch_cos_sim(embeddings[0], embeddings[1]).item()
#     return round(score, 4)

from sentence_transformers import SentenceTransformer, util

# Load all the models you want in your ensemble
models = {
    "bge": SentenceTransformer("BAAI/bge-small-en"),
    "multiqa": SentenceTransformer("sentence-transformers/multi-qa-MiniLM-L6-cos-v1"),
    "e5": SentenceTransformer("intfloat/e5-small-v2"),
    "paraphrase": SentenceTransformer("sentence-transformers/paraphrase-MiniLM-L6-v2")
}

def get_ensemble_score(topic: str, title: str, description: str):
    topic_text = f"query: I want to study {topic} and understand it"
    video_text = f"passage: {title}. {description}"

    model_scores = {}

    for name, model in models.items():
        embeddings = model.encode([topic_text, video_text], convert_to_tensor=True)
        score = util.pytorch_cos_sim(embeddings[0], embeddings[1]).item()
        model_scores[name] = round(score, 4)

    average_score = round(sum(model_scores.values()) / len(model_scores), 4)
    return average_score, model_scores



