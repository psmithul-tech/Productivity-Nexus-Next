import os
import torch
import torchaudio as ta
from chatterbox.tts_turbo import ChatterboxTurboTTS

device = "mps" if torch.backends.mps.is_available() else "cpu"
print(f"Loading Chatterbox Turbo on {device}...")

# This will wait for any active downloads to finish
model = ChatterboxTurboTTS.from_pretrained(device=device)

ref_clip = "/Users/mika/Downloads/free/flirty_endearing_07.wav"
text = "Hi there! I'm using the new flirty and endearing voice you asked for. How does it sound?"

print("Generating audio...")
wav = model.generate(text, audio_prompt_path=ref_clip)

out_path = "public/test_voice.wav"
ta.save(out_path, wav, model.sr)
print(f"Saved test audio to {out_path}")
