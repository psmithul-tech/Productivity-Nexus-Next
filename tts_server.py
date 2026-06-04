import os
import torch
import torchaudio as ta
import tempfile
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.responses import Response

# Fallback device selection
if torch.backends.mps.is_available():
    device = "mps"
elif torch.cuda.is_available():
    device = "cuda"
else:
    device = "cpu"

print(f"Loading Chatterbox TTS on device: {device}...")

try:
    from chatterbox.tts_turbo import ChatterboxTurboTTS
    model = ChatterboxTurboTTS.from_pretrained(device=device)
    print("Model loaded successfully!")
except Exception as e:
    print(f"Failed to load model: {e}")
    model = None

app = FastAPI()

class TTSRequest(BaseModel):
    text: str
    voice: str = "britney"

@app.post("/generate")
def generate_tts(req: TTSRequest):
    if model is None:
        raise HTTPException(status_code=500, detail="TTS Model is not loaded.")
        
    ref_clip = f"public/{req.voice}.wav"
    if not os.path.exists(ref_clip):
        print(f"Warning: Reference clip {ref_clip} not found. Ensure it exists.")
        raise HTTPException(status_code=400, detail=f"Reference clip {ref_clip} not found.")

    try:
        print(f"Generating audio for text: '{req.text}' using voice: {req.voice}")
        wav = model.generate(req.text, audio_prompt_path=ref_clip)
        
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
            temp_path = f.name
            
        ta.save(temp_path, wav, model.sr)
        
        with open(temp_path, "rb") as f:
            audio_data = f.read()
            
        os.remove(temp_path)
        
        return Response(content=audio_data, media_type="audio/wav")
    except Exception as e:
        print(f"Error generating audio: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
