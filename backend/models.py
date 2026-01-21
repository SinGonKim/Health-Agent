from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, JSON, ForeignKey, func
from sqlalchemy.orm import relationship
try:
    # Run from repo root: uvicorn backend.main:app
from backend.core.database import Base
except ModuleNotFoundError:
    # Run from backend/ directory: uvicorn main:app
    from core.database import Base
from datetime import datetime

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    nickname = Column(String, default="User")
    height_cm = Column(Float, nullable=True)
    weight_kg = Column(Float, nullable=True)
    goals = Column(String, nullable=True)
    
    diet_logs = relationship("DietLog", back_populates="user")
    exercise_logs = relationship("ExerciseLog", back_populates="user")
    health_metrics = relationship("HealthMetric", back_populates="user")
    daily_reports = relationship("DailyReport", back_populates="user")

class DietLog(Base):
    __tablename__ = "diet_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    image_path = Column(String, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    food_items = Column(JSON, nullable=True)  # List of {name, kcal, ...}
    total_kcal = Column(Integer, default=0)
    is_confirmed = Column(Boolean, default=False)

    user = relationship("User", back_populates="diet_logs")

class ExerciseLog(Base):
    __tablename__ = "exercise_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    image_path = Column(String, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    exercise_type = Column(String, nullable=True)
    feedback_text = Column(Text, nullable=True)

    user = relationship("User", back_populates="exercise_logs")

class HealthMetric(Base):
    __tablename__ = "health_metrics"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    record_date = Column(DateTime, default=datetime.now)  # Store just date usually
    sleep_hours = Column(Float, default=0.0)
    heart_rate_avg = Column(Integer, default=0)
    current_weight_kg = Column(Float, default=0.0)

    user = relationship("User", back_populates="health_metrics")

class DailyReport(Base):
    __tablename__ = "daily_reports"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    record_date = Column(DateTime, default=datetime.utcnow)
    summary_content = Column(Text, nullable=True)
    email_sent = Column(Boolean, default=False)
    kakao_sent = Column(Boolean, default=False)

    user = relationship("User", back_populates="daily_reports")
