import json
import os
import sqlite3
from datetime import datetime, timedelta, timezone
from typing import Optional

import bcrypt
import httpx
import jwt
import uvicorn
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, File, Header, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from google import genai
from google.genai import types
from pydantic import BaseModel, Field

load_dotenv()

app = FastAPI(title="MediScan+ Node 2 Backend", version="2.0.0")

DAILYMED_BASE_URL = "https://dailymed.nlm.nih.gov/dailymed/services/v2"
DB_PATH = os.getenv("MEDISCAN_DB_PATH", "mediscan.db")
OCR_SERVICE_URL = os.getenv("OCR_SERVICE_URL", "").strip()
JWT_SECRET = os.getenv("JWT_SECRET", "dev-only-change-me-please-set-32chars")
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_MINUTES = int(os.getenv("JWT_ACCESS_MINUTES", "120"))

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("static", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def _hash_password(password: str) -> str:
    hashed = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())
    return hashed.decode("utf-8")


def _verify_password(password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))
    except ValueError:
        return False


def _create_access_token(user_id: str) -> str:
    expires_at = _utc_now() + timedelta(minutes=ACCESS_TOKEN_MINUTES)
    payload = {
        "sub": user_id,
        "exp": expires_at,
        "iat": _utc_now(),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def _parse_bearer_token(authorization: Optional[str]) -> str:
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization header.")
    token_type, _, token = authorization.partition(" ")
    if token_type.lower() != "bearer" or not token:
        raise HTTPException(status_code=401, detail="Authorization must be: Bearer <token>.")
    return token


def _decode_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired.")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token.")
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload.")
    return payload


def _daily_med_url(path: str) -> str:
    return f"{DAILYMED_BASE_URL}/{path.lstrip('/')}"


def _init_db() -> None:
    conn = _get_connection()
    cur = conn.cursor()
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS user_auth (
            account_id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT UNIQUE NOT NULL,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            active INTEGER NOT NULL DEFAULT 1,
            created_at TEXT NOT NULL
        )
        """
    )
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS user_records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            medication_name TEXT NOT NULL,
            dosage TEXT DEFAULT '',
            frequency TEXT DEFAULT '',
            notes TEXT DEFAULT '',
            source TEXT DEFAULT 'manual',
            created_at TEXT NOT NULL,
            FOREIGN KEY(user_id) REFERENCES user_auth(user_id)
        )
        """
    )
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS suggestion_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            medication_name TEXT NOT NULL,
            response_json TEXT NOT NULL,
            created_at TEXT NOT NULL,
            FOREIGN KEY(user_id) REFERENCES user_auth(user_id)
        )
        """
    )
    conn.commit()
    conn.close()


# Initialize at import time so CLI scripts/tests work
# even when ASGI startup hooks are not executed.
_init_db()


@app.on_event("startup")
async def startup_event() -> None:
    _init_db()


def get_genai_client():
    if not os.environ.get("GEMINI_API_KEY"):
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY is not configured.")
    return genai.Client()


def _get_active_user_by_token(authorization: Optional[str]) -> sqlite3.Row:
    token = _parse_bearer_token(authorization)
    payload = _decode_token(token)
    user_id = payload["sub"]
    conn = _get_connection()
    user = conn.execute(
        """
        SELECT user_id, username, active
        FROM user_auth
        WHERE user_id = ?
        """,
        (user_id,),
    ).fetchone()
    conn.close()
    if not user or user["active"] != 1:
        raise HTTPException(status_code=401, detail="User is inactive or not found.")
    return user


async def get_current_user(authorization: Optional[str] = Header(default=None)) -> sqlite3.Row:
    return _get_active_user_by_token(authorization)


class RegisterRequest(BaseModel):
    user_id: str = Field(min_length=2, max_length=64)
    username: str = Field(min_length=2, max_length=64)
    password: str = Field(min_length=8, max_length=128)


class LoginRequest(BaseModel):
    user_id: str = Field(min_length=2, max_length=64)
    password: str = Field(min_length=8, max_length=128)


class LegacyAuthRequest(BaseModel):
    mode: str
    user_id: str
    username: str
    password: str


class HealthRecordCreateRequest(BaseModel):
    medication_name: str = Field(min_length=1, max_length=120)
    dosage: str = Field(default="", max_length=120)
    frequency: str = Field(default="", max_length=120)
    notes: str = Field(default="", max_length=500)
    source: str = Field(default="manual", max_length=32)


class AlternativeRequest(BaseModel):
    medication_name: str = Field(min_length=1, max_length=120)
    reason: str = Field(default="", max_length=300)
    allergies: list[str] = Field(default_factory=list)
    current_medications: list[str] = Field(default_factory=list)


class OCRProxyResponse(BaseModel):
    ok: bool
    upstream_status: int
    data: dict


class PrescriptionData(BaseModel):
    medication_name: str = Field(description="Medication name")
    dosage: str = Field(description="Dosage amount and unit")
    frequency: str = Field(description="How often to take")
    additional_notes: str = Field(description="Additional instructions or warnings")


@app.get("/health")
async def health() -> dict:
    return {"status": "ok", "service": "mediscan-node2-backend", "version": "2.0.0"}


@app.get("/", response_class=HTMLResponse)
async def read_root():
    try:
        with open("static/index.html", "r", encoding="utf-8") as f:
            return f.read()
    except FileNotFoundError:
        return "Frontend not found. Please create static/index.html"


@app.post("/api/auth/register")
async def register(payload: RegisterRequest):
    conn = _get_connection()
    try:
        conn.execute(
            """
            INSERT INTO user_auth (user_id, username, password_hash, active, created_at)
            VALUES (?, ?, ?, 1, ?)
            """,
            (
                payload.user_id.strip(),
                payload.username.strip(),
                _hash_password(payload.password),
                _utc_now().isoformat(),
            ),
        )
        conn.commit()
    except sqlite3.IntegrityError:
        conn.close()
        raise HTTPException(status_code=409, detail="user_id or username already exists.")
    conn.close()
    token = _create_access_token(payload.user_id.strip())
    return {"ok": True, "user_id": payload.user_id.strip(), "username": payload.username.strip(), "access_token": token}


@app.post("/api/auth/login")
async def login(payload: LoginRequest):
    conn = _get_connection()
    row = conn.execute(
        """
        SELECT user_id, username, password_hash, active
        FROM user_auth
        WHERE user_id = ?
        """,
        (payload.user_id.strip(),),
    ).fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="User not found.")
    if row["active"] != 1:
        raise HTTPException(status_code=403, detail="User is inactive.")
    if not _verify_password(payload.password, row["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials.")
    token = _create_access_token(row["user_id"])
    return {"ok": True, "user_id": row["user_id"], "username": row["username"], "access_token": token}


@app.get("/api/auth/me")
async def me(current_user: sqlite3.Row = Depends(get_current_user)):
    return {"user_id": current_user["user_id"], "username": current_user["username"]}


@app.post("/api/auth")
async def legacy_auth(payload: LegacyAuthRequest):
    mode = payload.mode.strip().lower()
    if mode == "register":
        return await register(
            RegisterRequest(
                user_id=payload.user_id,
                username=payload.username,
                password=payload.password,
            )
        )
    if mode == "login":
        return await login(
            LoginRequest(
                user_id=payload.user_id,
                password=payload.password,
            )
        )
    raise HTTPException(status_code=400, detail="Invalid mode. Use register or login.")


@app.post("/api/ocr/extract", response_model=OCRProxyResponse)
async def ocr_proxy(file: UploadFile = File(...), current_user: sqlite3.Row = Depends(get_current_user)):
    del current_user
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Uploaded file must be an image.")
    if not OCR_SERVICE_URL:
        raise HTTPException(
            status_code=501,
            detail="OCR_SERVICE_URL is not configured. OCR is handled by another service.",
        )

    body = await file.read()
    files = {"file": (file.filename or "prescription.jpg", body, file.content_type)}
    async with httpx.AsyncClient(timeout=45.0) as client:
        upstream = await client.post(OCR_SERVICE_URL, files=files)

    try:
        parsed = upstream.json()
    except ValueError:
        parsed = {"raw_text": upstream.text}

    if upstream.status_code >= 400:
        raise HTTPException(status_code=502, detail=f"OCR service error: {parsed}")

    return OCRProxyResponse(ok=True, upstream_status=upstream.status_code, data=parsed)


async def _extract_with_gemini(file: UploadFile) -> dict:
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Uploaded file must be an image.")
    client = get_genai_client()
    body = await file.read()
    image_part = types.Part.from_bytes(
        data=body,
        mime_type=file.content_type,
    )
    prompt = (
        "Read this prescription image and return strict JSON with fields: "
        "medication_name, dosage, frequency, additional_notes."
    )
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=[image_part, prompt],
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=PrescriptionData,
            temperature=0.1,
        ),
    )
    try:
        return json.loads(response.text)
    except json.JSONDecodeError:
        raise HTTPException(status_code=502, detail="Gemini returned invalid JSON.")


def _safety_disclaimer() -> str:
    return (
        "These suggestions are AI-generated and for informational purposes only. "
        "Do NOT take, stop, or switch medication based only on this output. "
        "Always verify with a licensed clinician or pharmacist."
    )


def _generate_quick_alternatives(medication_name: str) -> dict:
    med_name = (medication_name or "").strip()
    if not med_name:
        return {
            "alternatives": [],
            "disclaimer": _safety_disclaimer(),
            "is_medical_advice": False,
        }

    if os.environ.get("GEMINI_API_KEY"):
        client = get_genai_client()
        prompt = (
            "Suggest up to 5 alternative medications.\n"
            "Return strict JSON with keys: alternatives, disclaimer.\n"
            "Each alternatives item must include: name, rationale, caution.\n"
            f"Medication: {med_name}\n"
            "Disclaimer must clearly say this is not medical advice."
        )
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.2,
            ),
        )
        try:
            data = json.loads(response.text)
            if not isinstance(data, dict):
                data = {}
        except json.JSONDecodeError:
            data = {}
        data["disclaimer"] = _safety_disclaimer()
        data["is_medical_advice"] = False
        if "alternatives" not in data or not isinstance(data["alternatives"], list):
            data["alternatives"] = []
        return data

    return {
        "alternatives": [],
        "disclaimer": _safety_disclaimer(),
        "is_medical_advice": False,
    }


@app.post("/api/extract")
async def extract_compat(file: UploadFile = File(...)):
    # Web UI compatibility route:
    # - If OCR_SERVICE_URL is set, proxy to external OCR service.
    # - Else, run direct Gemini extraction so this works with only GEMINI_API_KEY.
    if OCR_SERVICE_URL:
        if not file.content_type or not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="Uploaded file must be an image.")
        body = await file.read()
        files = {"file": (file.filename or "prescription.jpg", body, file.content_type)}
        async with httpx.AsyncClient(timeout=45.0) as client:
            upstream = await client.post(OCR_SERVICE_URL, files=files)
        try:
            parsed = upstream.json()
        except ValueError:
            parsed = {"raw_text": upstream.text}
        if upstream.status_code >= 400:
            raise HTTPException(status_code=502, detail=f"OCR service error: {parsed}")
        med_name = parsed.get("medication_name", "") if isinstance(parsed, dict) else ""
        quick_alt = _generate_quick_alternatives(med_name)
        return {
            "extracted": parsed,
            "alternatives": quick_alt.get("alternatives", []),
            "disclaimer": quick_alt.get("disclaimer", _safety_disclaimer()),
            "is_medical_advice": False,
        }

    extracted = await _extract_with_gemini(file)
    quick_alt = _generate_quick_alternatives(extracted.get("medication_name", ""))
    return {
        "extracted": extracted,
        "alternatives": quick_alt.get("alternatives", []),
        "disclaimer": quick_alt.get("disclaimer", _safety_disclaimer()),
        "is_medical_advice": False,
    }


@app.get("/api/medications/search")
async def search_medications(
    q: str = Query(..., min_length=1),
    limit: int = Query(10, ge=1, le=25),
    current_user: sqlite3.Row = Depends(get_current_user),
):
    del current_user
    async with httpx.AsyncClient(timeout=20.0) as client:
        response = await client.get(_daily_med_url("spls.json"), params={"drug_name": q.strip()})
    if response.status_code != 200:
        raise HTTPException(status_code=502, detail=f"DailyMed lookup failed ({response.status_code}).")
    items = response.json().get("data", [])
    result = []
    for row in items[:limit]:
        result.append(
            {
                "setid": row.get("setid"),
                "title": row.get("title"),
                "published_date": row.get("published_date"),
            }
        )
    return {"query": q.strip(), "count": len(result), "items": result}


@app.get("/api/medications/{setid}")
async def medication_guidance(setid: str, current_user: sqlite3.Row = Depends(get_current_user)):
    del current_user
    async with httpx.AsyncClient(timeout=20.0) as client:
        response = await client.get(_daily_med_url(f"spls/{setid}.json"))
    if response.status_code != 200:
        raise HTTPException(status_code=502, detail=f"DailyMed details failed ({response.status_code}).")
    data = response.json().get("data", {})
    return {
        "setid": setid,
        "title": data.get("title"),
        "indications_and_usage": data.get("indications_and_usage"),
        "dosage_and_administration": data.get("dosage_and_administration"),
        "warnings": data.get("warnings"),
    }


@app.post("/api/medications/alternatives")
async def medication_alternatives(
    payload: AlternativeRequest,
    current_user: sqlite3.Row = Depends(get_current_user),
):
    medication_name = payload.medication_name.strip()
    if not medication_name:
        raise HTTPException(status_code=400, detail="medication_name is required.")

    alternatives_response: dict
    if os.environ.get("GEMINI_API_KEY"):
        prompt = (
            "You are a medication guidance assistant. Suggest up to 5 alternatives.\n"
            "Return strict JSON with key 'alternatives' and each item containing "
            "name, rationale, caution.\n"
            f"Medication: {medication_name}\n"
            f"Reason: {payload.reason or 'N/A'}\n"
            f"Allergies: {', '.join(payload.allergies) if payload.allergies else 'None'}\n"
            f"Current meds: {', '.join(payload.current_medications) if payload.current_medications else 'None'}\n"
            "Include a short 'disclaimer' field reminding users to verify with clinicians."
        )
        client = get_genai_client()
        gemini_response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.2,
            ),
        )
        try:
            alternatives_response = json.loads(gemini_response.text)
        except json.JSONDecodeError:
            alternatives_response = {"alternatives": [], "disclaimer": "Could not parse Gemini response."}
    else:
        async with httpx.AsyncClient(timeout=15.0) as client:
            r = await client.get(_daily_med_url("spls.json"), params={"drug_name": medication_name})
        if r.status_code != 200:
            raise HTTPException(status_code=502, detail="Alternative lookup failed.")
        items = r.json().get("data", [])
        unique_titles = []
        seen = set()
        for row in items:
            title = row.get("title")
            if title and title not in seen:
                seen.add(title)
                unique_titles.append(title)
            if len(unique_titles) >= 5:
                break
        alternatives_response = {
            "alternatives": [
                {
                    "name": title,
                    "rationale": "Matched similar DailyMed listing.",
                    "caution": "Confirm suitability with a clinician.",
                }
                for title in unique_titles
            ],
            "disclaimer": "Fallback suggestions generated without Gemini.",
        }

    # Force a consistent frontend-facing safety warning.
    alternatives_response["disclaimer"] = (
        "These suggestions are AI-generated and for informational purposes only. "
        "Do NOT take, stop, or switch medication based only on this output. "
        "Always verify with a licensed clinician or pharmacist."
    )
    alternatives_response["is_medical_advice"] = False

    conn = _get_connection()
    conn.execute(
        """
        INSERT INTO suggestion_history (user_id, medication_name, response_json, created_at)
        VALUES (?, ?, ?, ?)
        """,
        (
            current_user["user_id"],
            medication_name,
            json.dumps(alternatives_response),
            _utc_now().isoformat(),
        ),
    )
    conn.execute(
        """
        INSERT INTO user_records (user_id, medication_name, dosage, frequency, notes, source, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (
            current_user["user_id"],
            medication_name,
            "",
            "",
            json.dumps(
                {
                    "type": "alternative_suggestion",
                    "alternatives_count": len(alternatives_response.get("alternatives", [])),
                    "disclaimer": alternatives_response["disclaimer"],
                }
            ),
            "alternative_suggestion",
            _utc_now().isoformat(),
        ),
    )
    conn.commit()
    conn.close()

    return alternatives_response


@app.post("/api/history")
async def create_health_record(
    payload: HealthRecordCreateRequest,
    current_user: sqlite3.Row = Depends(get_current_user),
):
    conn = _get_connection()
    conn.execute(
        """
        INSERT INTO user_records (user_id, medication_name, dosage, frequency, notes, source, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (
            current_user["user_id"],
            payload.medication_name.strip(),
            payload.dosage.strip(),
            payload.frequency.strip(),
            payload.notes.strip(),
            payload.source.strip(),
            _utc_now().isoformat(),
        ),
    )
    conn.commit()
    row_id = conn.execute("SELECT last_insert_rowid() AS id").fetchone()["id"]
    conn.close()
    return {"ok": True, "record_id": row_id}


@app.get("/api/history")
async def list_health_records(
    current_user: sqlite3.Row = Depends(get_current_user),
    limit: int = Query(50, ge=1, le=200),
):
    conn = _get_connection()
    rows = conn.execute(
        """
        SELECT id, medication_name, dosage, frequency, notes, source, created_at
        FROM user_records
        WHERE user_id = ?
        ORDER BY id DESC
        LIMIT ?
        """,
        (current_user["user_id"], limit),
    ).fetchall()
    conn.close()
    return {"count": len(rows), "items": [dict(row) for row in rows]}


@app.get("/api/history/alternatives")
async def list_alternative_history(
    current_user: sqlite3.Row = Depends(get_current_user),
    limit: int = Query(20, ge=1, le=100),
):
    conn = _get_connection()
    rows = conn.execute(
        """
        SELECT id, medication_name, response_json, created_at
        FROM suggestion_history
        WHERE user_id = ?
        ORDER BY id DESC
        LIMIT ?
        """,
        (current_user["user_id"], limit),
    ).fetchall()
    conn.close()
    items = []
    for row in rows:
        parsed = {}
        try:
            parsed = json.loads(row["response_json"])
        except json.JSONDecodeError:
            parsed = {"raw": row["response_json"]}
        items.append(
            {
                "id": row["id"],
                "medication_name": row["medication_name"],
                "response": parsed,
                "created_at": row["created_at"],
            }
        )
    return {"count": len(items), "items": items}


@app.get("/api/meds")
async def legacy_meds(
    query: str = Query(..., min_length=1),
    current_user: sqlite3.Row = Depends(get_current_user),
):
    return await search_medications(q=query, limit=10, current_user=current_user)


@app.post("/api/alternatives")
async def legacy_alternatives(
    payload: AlternativeRequest,
    current_user: sqlite3.Row = Depends(get_current_user),
):
    return await medication_alternatives(payload=payload, current_user=current_user)


@app.post("/api/users/{user_id}/records")
async def legacy_create_record(
    user_id: str,
    payload: HealthRecordCreateRequest,
    current_user: sqlite3.Row = Depends(get_current_user),
):
    if current_user["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Cannot write records for another user.")
    return await create_health_record(payload=payload, current_user=current_user)


@app.get("/api/users/{user_id}/records")
async def legacy_list_record(
    user_id: str,
    current_user: sqlite3.Row = Depends(get_current_user),
):
    if current_user["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Cannot read records for another user.")
    return await list_health_records(current_user=current_user)


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
