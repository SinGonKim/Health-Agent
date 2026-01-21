from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from sqlalchemy.orm import Session
from backend.core.database import get_db
from backend.models import DietLog, User
from backend.services.ai_service import analyze_diet_image
import shutil
import os
import uuid

router = APIRouter()
UPLOAD_DIR = "backend/uploads"

@router.post("/analyze")
async def analyze_diet(
    file: UploadFile = File(None),
    text_input: str = Form(""),
    db: Session = Depends(get_db)
):
    image_bytes = None
    file_path = None
    content_type = "image/jpeg"

    if file:
        file_extension = file.filename.split(".")[-1]
        filename = f"{uuid.uuid4()}.{file_extension}"
        file_path = os.path.join(UPLOAD_DIR, filename)
        
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
            await file.seek(0)
            image_bytes = await file.read()
        content_type = file.content_type

    try:
        analysis_result = await analyze_diet_image(image_bytes, content_type, text_input)
    except Exception as e:
        return {
            "image_path": file_path,
            "analysis": {
                "items": [],
                "total_kcal": 0,
                "advice": f"AI Analysis failed. {str(e)}"
            }
        }

    return {
        "image_path": file_path,
        "analysis": analysis_result
    }

@router.post("/confirm")
async def confirm_diet_log(log_data: dict, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == log_data.get("user_id", 1)).first()
    if not user:
        user = User(id=1, nickname="Default User")
        db.add(user)
        db.commit()

    new_log = DietLog(
        user_id=log_data.get("user_id", 1),
        image_path=log_data.get("image_path"),
        food_items=log_data["analysis"]["items"],
        total_kcal=log_data["analysis"]["total_kcal"],
        is_confirmed=True
    )
    db.add(new_log)
    db.commit()
    db.refresh(new_log)
    return new_log
@router.get("/history")
async def get_diet_history(user_id: int = 1, db: Session = Depends(get_db)):
    logs = db.query(DietLog).filter(DietLog.user_id == user_id)\
        .order_by(DietLog.timestamp.desc()).all()
    return logs
