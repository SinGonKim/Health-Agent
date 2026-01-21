from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.core.database import get_db
from backend.models import DietLog, User
from datetime import datetime, date, timedelta

router = APIRouter()

@router.get("/summary")
async def get_daily_summary(user_id: int = 1, db: Session = Depends(get_db)):
    # Get start and end of today (UTC or Server Local Time - simplified to UTC date for MVP)
    today = datetime.utcnow().date()
    start_of_day = datetime.combine(today, datetime.min.time())
    end_of_day = datetime.combine(today, datetime.max.time())

    # Sum calories from DietLog where is_confirmed is True
    total_calories = db.query(func.sum(DietLog.total_kcal))\
        .filter(DietLog.user_id == user_id)\
        .filter(DietLog.is_confirmed == True)\
        .filter(DietLog.timestamp >= start_of_day)\
        .filter(DietLog.timestamp <= end_of_day)\
        .scalar() or 0

    return {
        "date": str(today),
        "total_calories": total_calories,
        "goal_calories": 2000, # Hardcoded for now or fetch from User model
        "percentage": min(int((total_calories / 2000) * 100), 100)
    }
@router.post("/evaluate-plan")
async def post_plan_evaluation(data: dict, db: Session = Depends(get_db)):
    user_id = data.get("user_id", 1)
    user_plan = data.get("user_plan", "")
    
    if not user_plan:
        raise HTTPException(status_code=400, detail="User plan is required")

    # Fetch history for context
    from backend.models import ExerciseLog
    diet_logs = db.query(DietLog).filter(DietLog.user_id == user_id)\
        .order_by(DietLog.timestamp.desc()).limit(5).all()
    
    exercise_logs = db.query(ExerciseLog).filter(ExerciseLog.user_id == user_id)\
        .order_by(ExerciseLog.timestamp.desc()).limit(5).all()
    
    # Format for AI
    diet_text = "\n".join([f"- {log.timestamp.date()}: {log.food_items} ({log.total_kcal} kcal)" for log in diet_logs])
    ex_text = "\n".join([f"- {log.timestamp.date()}: {log.exercise_type} - {log.feedback_text}" for log in exercise_logs])
    
    from backend.services.ai_service import evaluate_user_plan
    try:
        evaluation = await evaluate_user_plan(user_plan, diet_text, ex_text)
        return evaluation
    except HTTPException as e:
        return {"error": e.detail}
    except Exception as e:
        return {"error": str(e)}

@router.get("/daily-recommendations")
async def get_daily_recommendations_endpoint(user_id: int = 1, db: Session = Depends(get_db)):
    from backend.models import DietLog, ExerciseLog, RecommendationCache
    
    # 1. Get latest log timestamps
    latest_diet = db.query(func.max(DietLog.timestamp)).filter(DietLog.user_id == user_id).scalar()
    latest_ex = db.query(func.max(ExerciseLog.timestamp)).filter(ExerciseLog.user_id == user_id).scalar()
    
    # 2. Check Cache
    cache = db.query(RecommendationCache).filter(RecommendationCache.user_id == user_id).first()
    
    if cache:
        # Check if cache is still valid (generated after last logs)
        # Use a small buffer or just strict comparison. generated_at is in UTC.
        # SQLite storage might differ in microsecond precision, so compare carefully.
        is_diet_valid = latest_diet is None or cache.generated_at >= latest_diet
        is_ex_valid = latest_ex is None or cache.generated_at >= latest_ex
        
        print(f"[DEBUG] Cache Gen: {cache.generated_at}, Latest Diet: {latest_diet}, Latest Ex: {latest_ex}")
        
        if is_diet_valid and is_ex_valid:
            print("[DEBUG] Returning cached recommendations")
            return {
                "meal": cache.meal_recommendation,
                "workout": cache.workout_recommendation,
                "cached": True
            }
        else:
            print("[DEBUG] Cache expired. Generating new ones...")

    # 3. If invalid or missing, generate new
    # Fetch confirmed diet logs for context
    diet_logs = db.query(DietLog).filter(DietLog.user_id == user_id, DietLog.is_confirmed == True)\
        .order_by(DietLog.timestamp.desc()).limit(10).all()
    
    exercise_logs = db.query(ExerciseLog).filter(ExerciseLog.user_id == user_id)\
        .order_by(ExerciseLog.timestamp.desc()).limit(10).all()

    diet_text = "\n".join([f"- {log.food_items}" for log in diet_logs])
    ex_text = "\n".join([f"- {log.exercise_type}: {log.feedback_text}" for log in exercise_logs])

    print(f"[DEBUG] Fetching new recommendations for user {user_id}")
    from backend.services.ai_service import generate_daily_recommendations
    
    try:
        new_rec = await generate_daily_recommendations(diet_text, ex_text)
    except Exception as e:
        print(f"[ERROR] Failed to generate recommendations: {e}")
        # Return fallback but don't cache it as 'generated successfully' 
        # Or cache a placeholder if we want to avoid hammering the AI
        return {
            "meal": "균형 잡힌 한식 (백반)",
            "workout": "가벼운 산책 30분",
            "cached": False,
            "error": True
        }

    # 4. Update or create cache
    if not cache:
        cache = RecommendationCache(user_id=user_id)
        db.add(cache)
    
    cache.meal_recommendation = new_rec.get("meal", "알 수 없음")
    cache.workout_recommendation = new_rec.get("workout", "알 수 없음")
    cache.generated_at = datetime.utcnow()
    
    db.commit()
    print(f"[DEBUG] Recommendation updated at {cache.generated_at}")
    
    return {
        "meal": cache.meal_recommendation,
        "workout": cache.workout_recommendation,
        "cached": False
    }

