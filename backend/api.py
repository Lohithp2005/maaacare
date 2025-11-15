from fastapi import FastAPI ,Request,File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from agent2 import run_agents
from typing import Optional
from pydantic import BaseModel
from memory import PATIENT_DATA, save_data
import subprocess
import io
import subprocess
import sys
import os
import subprocess
import sys
import json
import torch
import open_clip
from PIL import Image
from ollama import chat, ChatResponse  
from elevenlabs import ElevenLabs
from fastapi.responses import  JSONResponse, StreamingResponse





app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"], 
    allow_headers=["*"],
)

class PatientInfo(BaseModel):
    fullName: Optional[str] = None
    trimester: Optional[str] = None
    allergies: Optional[str] = None
    medications: Optional[str] = None
    emergencyContact: Optional[str] = None
    
@app.post("/chat")
async def chat_endpoint(request:Request):
    data = await request.json()
    print("Recieved",data)
    user_question = data.get("question")
    
    answer = run_agents(user_question)
    print("This is the answer being sent to frontend")
    print(answer)
    return {"answer":answer}

@app.post("/submit_patient_info")
async def submit(data:PatientInfo):
    PATIENT_DATA["patient"] = data.model_dump()
    save_data(PATIENT_DATA)
    print(PATIENT_DATA)
    return {"status": "success", "data": data}


@app.get("/get_patient_info/")
async def get_patient_info():
    return {"data": PATIENT_DATA.get("patient", {})}

@app.get("/start-pose")
def start_pose(exercise_name: str = "General Exercise"):
    """
    Starts pose_detection.py in a NEW terminal window with default exercise.
    """
    script_path = os.path.join(os.getcwd(), "pose.py")

    if not os.path.exists(script_path):
        return {"status": "error", "message": f"File not found: {script_path}"}

    try:
        if sys.platform == "win32":
            subprocess.Popen(["cmd.exe", "/K", f"{sys.executable} {script_path} {exercise_name}"])
        elif sys.platform == "darwin":
            subprocess.Popen(
                ["osascript", "-e",
                 f'tell application "Terminal" to do script "cd {os.getcwd()} && {sys.executable} {script_path} \\"{exercise_name}\\""']
            )
        else:
            subprocess.Popen(["gnome-terminal", "--", sys.executable, script_path, exercise_name])

        return {
            "status": "success",
            "message": f"Pose detection started for '{exercise_name}'"
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}
    

PATH_FETALCLIP_CONFIG = "FetalCLIP_config.json"
PATH_FETALCLIP_WEIGHT = "FetalCLIP_weights.pt"


device = torch.device("cpu")  

with open(PATH_FETALCLIP_CONFIG, "r") as file:
    config_fetalclip = json.load(file)
open_clip.factory._MODEL_CONFIGS["FetalCLIP"] = config_fetalclip

model, preprocess_train, preprocess_test = open_clip.create_model_and_transforms(
    "FetalCLIP", pretrained=PATH_FETALCLIP_WEIGHT
)

@app.post("/ultrasound")
async def analyze_ultrasound(image: UploadFile = File(...)):
    model.eval()
    model.to(device)


    tokenizer = open_clip.get_tokenizer("FetalCLIP")
    img_bytes = await image.read()
    img_pil = Image.open(io.BytesIO(img_bytes)).convert("RGB")
    img_tensor = preprocess_test(img_pil).unsqueeze(0).to(device)

    text_prompts = [
        "Ultrasound image focusing on the fetal abdominal area, highlighting structural development.",
        "Fetal ultrasound image focusing on the heart, highlighting detailed cardiac structures.",
        "Other fetal anomaly or unusual features."
    ]
    text_tokens = tokenizer(text_prompts).to(device)

    with torch.no_grad():
        text_features = model.encode_text(text_tokens)
        image_features = model.encode_image(img_tensor)


        image_features /= image_features.norm(dim=-1, keepdim=True)
        text_features /= text_features.norm(dim=-1, keepdim=True)

        text_probs = (100.0 * image_features @ text_features.T).softmax(dim=-1)

    probs = text_probs[0].tolist()
    pred_text = f"Abdominal: {probs[0]*100:.2f}%, Heart: {probs[1]*100:.2f}%, Other: {probs[2]*100:.2f}%"
    print("Prediction probabilities:", pred_text)

    prompt = f"Please summarize the following fetal ultrasound results in simple words:\n{pred_text}"
    response: ChatResponse = chat(
        model="llama3.2",
        messages=[{"role": "user", "content": prompt}]
    )

    print("\nQwen3 Summary:\n", response.message.content)
    return {"summary": response.message.content, "raw_probs": probs}

client = ElevenLabs(api_key=os.getenv("ELEVENLABS_API_KEY"))


client.text_to_speech.convert(
    voice_id="JBFqnCBsd6RMkjVDRZzb",
    output_format="mp3_44100_128",
    text="The first move is what sets everything in motion.",
    model_id="eleven_multilingual_v2",
)


@app.get("/chat/audio")
async def chat_audio(text: str):
    # Stream TTS directly
    audio_stream = client.text_to_speech.stream(
        voice_id="cgSgspJ2msm6clMCkdW9",
        text=text,
        model_id="eleven_v3"
    )
    return StreamingResponse(audio_stream, media_type="audio/mpeg")

@app.post("/stt")
async def stt(file: UploadFile):
    transcription = client.speech_to_text.convert(
        file=file.file,
        model_id="scribe_v1",
        language_code="kan",
        diarize=False,
    )
    return JSONResponse({"text": transcription.text})

