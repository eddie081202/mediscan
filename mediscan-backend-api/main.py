from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os
import json
from dotenv import load_dotenv
from pydantic import BaseModel, Field
from google import genai
from google.genai import types

load_dotenv()

app = FastAPI(title="MediScan+ API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("static", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

def get_genai_client():
    if not os.environ.get("GEMINI_API_KEY"):
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY environment variable is not set.")
    return genai.Client()

class MedicationInfo(BaseModel):
    medication_name: str = Field(description="The brand/generic name of the medication.")
    usage_info: str = Field(description="A single sentence containing all usage information regarding dosage, frequency, and directions.")
    additional_notes: str = Field(description="Any other instructions, warnings, or notes on the prescription.")

class AlternativeMedication(BaseModel):
    name: str = Field(description="The brand or generic name of the alternative medication.")
    active_ingredient: str = Field(description="The active salt or chemical ingredient of this alternative (e.g. 'Amoxicillin 500mg').")
    drug_class: str = Field(description="The pharmacological class or category this drug belongs to (e.g. 'Beta-lactam antibiotic').")
    why_similar: str = Field(description="A single concise sentence explaining why this is a suitable alternative to the prescribed medication.")

class PrescriptionData(BaseModel):
    medication: MedicationInfo = Field(description="The primary medication details extracted from the prescription.")
    alternatives: list[AlternativeMedication] = Field(
        default=[],
        description="A list of at least 4 alternative medications with detailed information."
    )

@app.get("/{full_path:path}", response_class=HTMLResponse)
async def serve_spa(full_path: str):
    if full_path.startswith("api/") or full_path.startswith("static/"):
        raise HTTPException(status_code=404, detail="Not Found")
    try:
        with open("static/index.html", "r", encoding="utf-8") as f:
            return f.read()
    except FileNotFoundError:
        return "Frontend not found. Please build the Vite app first."

@app.post("/api/extract")
async def extract_prescription(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Uploaded file must be an image.")
        
    try:
        client = get_genai_client()
        contents = await file.read()
        
        image_part = types.Part.from_bytes(
            data=contents,
            mime_type=file.content_type,
        )
        
        prompt = (
            "Carefully read this handwritten doctor's prescription and extract the primary medication details. "
            "Then generate a list of at least 4 clinically relevant alternative medications. "
            "For each alternative provide: the medication name, its active salt or chemical ingredient (including typical dosage form), "
            "the pharmacological drug class it belongs to, and a concise one-sentence explanation of why it is a suitable alternative "
            "(e.g. same mechanism, same drug class, same indication, or generic equivalent)."
        )
        
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=[image_part, prompt],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=PrescriptionData,
                temperature=0.1
            )
        )
        
        extracted_data = json.loads(response.text)
        return JSONResponse(content=extracted_data)
        
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Failed to parse structured JSON from model response.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)