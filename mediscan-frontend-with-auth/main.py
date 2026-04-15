from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os
import json
from pydantic import BaseModel, Field
from google import genai
from google.genai import types

app = FastAPI(title="MediScan+ API")

# Allow CORS for development if needed
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for frontend
os.makedirs("static", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

# Make sure GEMINI_API_KEY is available in the environment variables
# Initialize the client at runtime so it doesn't crash on import if the key is missing
def get_genai_client():
    if not os.environ.get("GEMINI_API_KEY"):
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY environment variable is not set.")
    return genai.Client()

class PrescriptionData(BaseModel):
    medication_name: str = Field(description="The name of the medication.")
    dosage: str = Field(description="The dosage amount and unit (e.g., 500mg, 10ml, 1 tablet).")
    frequency: str = Field(description="How often to take the medication (e.g., twice a day, every 8 hours, PRN).")
    additional_notes: str = Field(description="Any other instructions, warnings, or notes on the prescription.")

@app.get("/", response_class=HTMLResponse)
async def read_root():
    try:
        with open("static/index.html", "r", encoding="utf-8") as f:
            return f.read()
    except FileNotFoundError:
        return "Frontend not found. Please create static/index.html"

@app.post("/api/extract")
async def extract_prescription(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Uploaded file must be an image.")
        
    try:
        client = get_genai_client()
        contents = await file.read()
        
        # Prepare the image part for GenAI
        image_part = types.Part.from_bytes(
            data=contents,
            mime_type=file.content_type,
        )
        
        prompt = "Carefully read this handwritten doctor's prescription and extract the requested details."
        
        # Call the model with structured outputs
        # We use gemini-2.5-flash as it is extremely fast and capable for multimodal tasks
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=[image_part, prompt],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=PrescriptionData,
                temperature=0.1 # Low temperature for more deterministic extraction
            )
        )
        
        # Parse the JSON string returned by Gemini into a dictionary
        extracted_data = json.loads(response.text)
        return JSONResponse(content=extracted_data)
        
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Failed to parse structured JSON from model response.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
