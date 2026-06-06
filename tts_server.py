import os
import tempfile
import psycopg2
import pandas as pd
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.responses import Response
from dotenv import load_dotenv

load_dotenv(".env.local")

try:
    from RealtimeTTS import TextToAudioStream, SystemEngine
except ImportError:
    TextToAudioStream = None
    SystemEngine = None

from reco_engine import RecommendationEngine, RecoConfig
from fastapi.middleware.cors import CORSMiddleware
import threading

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------- TTS -----------------
if TextToAudioStream is not None:
    engine = SystemEngine()
    stream = TextToAudioStream(engine)
else:
    stream = None

class TTSRequest(BaseModel):
    text: str

@app.post("/tts/speak")
def speak_tts(req: TTSRequest):
    if stream is None:
        raise HTTPException(status_code=500, detail="RealtimeTTS is not loaded.")
    try:
        stream.feed(req.text)
        stream.play_async()
        return {"status": "ok"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/tts/stop")
def stop_tts():
    if stream:
        stream.stop()
    return {"status": "ok"}

# ----------------- RECOMMENDATIONS -----------------

reco_engine = RecommendationEngine(RecoConfig())
MODEL_DIR = "./models/reco_v1"

# Load existing model if available
if os.path.exists(MODEL_DIR):
    try:
        reco_engine = RecommendationEngine.load(MODEL_DIR)
        print("Loaded existing RecommendationEngine model.")
    except Exception as e:
        print("Could not load model, starting fresh:", e)

def get_db_connection():
    return psycopg2.connect(os.getenv("DATABASE_URL"))

@app.post("/reco/fit")
def fit_engine():
    try:
        conn = get_db_connection()
        
        # Build content_df from media_catalog
        content_df = pd.read_sql("SELECT media_id as item_id, title, description, genre, tags, type, release_date FROM media_catalog", conn)
        
        # Build watch_df from watch_progress
        # We assume position/duration gives completion_pct
        watch_df = pd.read_sql("""
            SELECT user_id, anime_id as item_id, 
            CASE WHEN duration > 0 THEN CAST(position AS FLOAT)/duration ELSE 0 END as completion_pct
            FROM watch_progress
        """, conn)
        
        # Build ratings_df
        ratings_df = pd.read_sql("SELECT user_id, media_id as item_id, rating FROM media_ratings", conn)
        
        # Build search_df
        search_df = pd.read_sql("""
            SELECT user_id, clicked_media_id as item_id, 'click' as signal_type 
            FROM search_activity WHERE clicked_media_id IS NOT NULL
        """, conn)
        
        conn.close()

        print(f"Fitting with {len(content_df)} items, {len(watch_df)} watches, {len(ratings_df)} ratings")
        reco_engine.fit(
            watch_df=watch_df,
            content_df=content_df,
            ratings_df=ratings_df,
            search_df=search_df,
        )
        reco_engine.save(MODEL_DIR)
        return {"status": "success"}
    except Exception as e:
        print(f"Error fitting model: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/reco/recommend")
def get_recommendations(user_id: str, n: int = 20):
    try:
        results = reco_engine.recommend(user_id=user_id, n=n)
        return {"recommendations": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
