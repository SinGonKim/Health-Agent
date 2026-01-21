from dotenv import load_dotenv
import os
from pathlib import Path

# Load .env file - try both backend/.env and root/.env
env_path = Path(__file__).parent / ".env"
if env_path.exists():
    load_dotenv(env_path)
else:
    load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
try:
    # Run from repo root: uvicorn backend.main:app
    from backend.core.database import engine, Base
    from backend import models
    from backend.api.routes import diet
except ModuleNotFoundError:
    # Run from backend/ directory: uvicorn main:app
    from core.database import engine, Base
    import models
    from api.routes import diet

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="VibeHealth API", version="0.1.0")

# CORS
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://192.168.219.56:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(diet.router, prefix="/api/v1/diet", tags=["diet"])
from backend.api.routes import dashboard
app.include_router(dashboard.router, prefix="/api/v1/dashboard", tags=["dashboard"])
from backend.api.routes import exercise
app.include_router(exercise.router, prefix="/api/v1/exercise", tags=["exercise"])

@app.get("/")
def read_root():
    return {"message": "Welcome to VibeHealth API"}

@app.get("/health")
def health_check():
    return {"status": "ok"}
