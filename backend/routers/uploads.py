from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
import os
import uuid
import shutil
from pathlib import Path

from schemas.models import ImageUploadSignURL
from db.models import User
from routers.auth import get_current_user_from_token

router = APIRouter(prefix="/api/uploads", tags=["uploads"])

# Create uploads directory if it doesn't exist
UPLOADS_DIR = Path("/app/uploads")
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

@router.post("/upload-image")
async def upload_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user_from_token),
):
    if not current_user:
        raise HTTPException(status_code=401, detail="Unauthorized")

    file_ext = os.path.splitext(file.filename)[1]
    file_key = f"image_uploads/{uuid.uuid4()}{file_ext}"
    file_path = UPLOADS_DIR / file_key

    try:
        # Ensure the parent directory exists
        file_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Save uploaded file
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    return {
        "file_key": file_key,
        "url": f"/api/uploads/images/{file_key}",
    }

@router.get("/images/{file_key:path}")
async def get_image(file_key: str):
    file_path = UPLOADS_DIR / file_key
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Image not found")
    return FileResponse(file_path)