import uvicorn

from fastapi import Depends, FastAPI, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse, Response
from fastapi import FastAPI, Query, UploadFile, File

import pathlib
import json
import shutil
import uuid
import os
import subprocess
import whisper
from datetime import datetime, timezone
import threading
import traceback
from pydub import AudioSegment, silence, effects
import math
import torch

data_path = pathlib.Path(__file__).parent.joinpath("audionote-python-data")

desc_json_ending = "desc.json"

ffmpeg_loc = str(pathlib.Path(__file__).parent.joinpath("ffmpeg.exe"))

device = "cuda" if torch.cuda.is_available() else "cpu"
print(device)

model = whisper.load_model("medium").to(device)

def adaptive_split_on_silence(
    audio_path,
    out_mp3_path,
    max_chunk_length_seconds,
    silence_thresh_range=(-40, -20, 5),
    min_silence_len_range=(1000, 400, -200)
):
    audio_orig = AudioSegment.from_file(audio_path)
    audio_orig.export(out_mp3_path, format="mp3")

    audio = effects.normalize(audio_orig)
    min_chunks = math.ceil(audio.duration_seconds / max_chunk_length_seconds)

    # Try various silence thresholds and durations
    for silence_thresh in range(*silence_thresh_range):
        for min_silence_len in range(*min_silence_len_range):
            chunks = silence.split_on_silence(
                audio,
                min_silence_len=min_silence_len,
                silence_thresh=silence_thresh,
                keep_silence=200
            )
            if len(chunks) >= min_chunks:
                print(f"Split using silence_thresh={silence_thresh}, min_silence_len={min_silence_len}")
                return chunks

    # Fallback: Even split
    print("Fallback to even time-based splitting")
    total_duration = len(audio)
    ideal_chunk_len = total_duration // min_chunks

    chunks = [audio[i:i + ideal_chunk_len] for i in range(0, total_duration, ideal_chunk_len)]
    return chunks

def save_chunks(chunks, gen_uuid):
    paths = []
    for chunk in chunks:
        path = str(data_path.joinpath(gen_uuid).joinpath(f"temp_dat_{uuid.uuid4()}.wav"))
        chunk.export(path, format="wav")
        paths.append(path)
    return paths

def gen_transcript(input_filename, out_mp3_path, gen_uuid, on_transcribed):
    print(f"Starting transcript on {gen_uuid}")
    try:
        split_chunks = adaptive_split_on_silence(input_filename, out_mp3_path, 20)
        saved_chunks = save_chunks(split_chunks, gen_uuid)
        result = ""
        for x in saved_chunks:
            result = result + model.transcribe(x, language="en")["text"]
            os.remove(x)
        on_transcribed(result)
    except:
        traceback.print_exc()
        on_transcribed(None)
    print("Ended transcript")

def main():
    app = FastAPI()

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.mount("/assets", StaticFiles(directory=pathlib.Path(__file__).parent.parent.joinpath("audionote-react").joinpath("dist").joinpath("assets").resolve()), name="assets")

    def index():
        return FileResponse(path=pathlib.Path(__file__).parent.parent.joinpath("audionote-react").joinpath("dist").joinpath("index.html").resolve())

    @app.get("/", response_class=FileResponse)
    def get():
        return index()
    
    @app.get("/tags", response_class=FileResponse)
    def get_tags():
        return index()
    
    @app.get("/settings", response_class=FileResponse)
    def get_settings():
        return index()
    
    @app.get("/query_recordings", response_class=JSONResponse)
    def get_query_recordings():
        payload = {}

        for content in data_path.iterdir():
            if content.is_file():
                continue

            with open(content.joinpath(desc_json_ending), "r") as file:
                desc = json.load(file)

            payload.update(dict([(content.name, {
                "tags": desc["tags"],
                "transcription": desc["transcription"],
                "utc_datetime": desc["utc_datetime"]
            })]))

        return JSONResponse(content=payload)
    
    @app.post("/add_recording", response_class=Response)
    def post_add_recording(file: UploadFile = File(...)):
        gen_uuid = str(uuid.uuid4())

        data_path.joinpath(gen_uuid).mkdir()

        try:
            input_filename = data_path.joinpath(gen_uuid).joinpath(f"orig_dat{os.path.splitext(file.filename)[-1]}")
            out_mp3_path = data_path.joinpath(gen_uuid).joinpath(f"bett_dat.mp3")

            with open(input_filename, "wb") as f:
                f.write(file.file.read())

            def on_transcribed(transcription):
                if transcription == None:
                    shutil.rmtree(data_path.joinpath(gen_uuid))
                    return

                utc_datetime = datetime.now(timezone.utc).isoformat()
                with open(data_path.joinpath(gen_uuid).joinpath(desc_json_ending), "w") as desc:
                    json.dump({
                        "utc_datetime": utc_datetime,
                        "tags": [],
                        "transcription": transcription
                    }, desc)

            on_transcribed("CURRENTLY GETTING TRANSCRIPTION IN BACKEND")

            thr = threading.Thread(target=lambda: gen_transcript(str(input_filename), str(out_mp3_path), gen_uuid, on_transcribed))
            thr.start()

            return Response(status_code=200)
        except:
            traceback.print_exc()

            shutil.rmtree(data_path.joinpath(gen_uuid))

            return Response(status_code=500)

    @app.get("/audio", response_class=Response)
    def get_audio(id: str = Query(...)):
        for content in data_path.joinpath(id).iterdir():
            if content.name.startswith("bett_dat"):
                return FileResponse(str(content))

        return Response(status_code=500)

    @app.post("/remove_recording", response_class=Response)
    def post_remove_recording(id: str = Query(...)):
        shutil.rmtree(data_path.joinpath(id))

    @app.post("/add_recording_tag", response_class=Response)
    def post_add_recording_tag(id: str = Query(...), name: str = Query(...)):
        with open(data_path.joinpath(id).joinpath(desc_json_ending), "r") as file:
            desc = json.load(file)

        desc["tags"].append(name)

        with open(data_path.joinpath(id).joinpath(desc_json_ending), "w") as file:
            json.dump(desc, file)

    @app.post("/remove_recording_tag", response_class=Response)
    def post_remove_recording_tag(id: str = Query(...), name: str = Query(...)):
        with open(data_path.joinpath(id).joinpath(desc_json_ending), "r") as file:
            desc = json.load(file)

        desc["tags"].remove(name)

        with open(data_path.joinpath(id).joinpath(desc_json_ending), "w") as file:
            json.dump(desc, file)

    uvicorn.run(app, host="0.0.0.0", port=19422)

if __name__ == "__main__":
    main()