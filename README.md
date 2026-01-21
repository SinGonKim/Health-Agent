# ✨ VibeHealth: AI-Powered Multimodal Health Advisor

VibeHealth is a sophisticated, AI-driven personal health assistant that leverages multi-modal AI models to analyze your lifestyle through photos, videos, and text. It provides actionable critiques and daily recommendations tailored to your unique history.

## 🚀 Key Features

### 1. 📂 Multimodal Logging & Analysis
- **Smart Diet Log**: Analyze meals via photos or text descriptions. Get instant calorie estimation and nutritional feedback using **Qwen-2.5-VL**.
- **Exercise Analysis**: Submit photos, workout videos, or even YouTube links. **Qwen-2.5-VL** analyzes your form and intensity to provide personalized coaching.
- **History Tracking**: Comprehensive logs of your past activities with searchable history.

### 2. 🎯 AI Plan Evaluator
- **Interactive Critique**: Instead of generic advice, input your daily plan (e.g., "Skipping lunch for a 10km run") and get a professional critique.
- **Context-Aware**: Uses **qwen3-4b** to evaluate your plans against your last 10 diet and exercise records.
- **Actionable Verdicts**: Get a clear verdict (Great, Risky, Bad) with specific Pros, Cons, and Advice.

### 3. 🔥 Smart Dashboard
- **Dynamic Stats**: Real-time calorie tracking (Consumed vs. Goal).
- **Today's AI Suggestions**: Automated meal and workout recommendations appear instantly upon login.
- **Intelligent Caching**: AI suggestions are cached and only re-generated when new activity is detected, ensuring speed and efficiency.

---

## 🛠 Tech Stack

- **Frontend**: [Next.js](https://nextjs.org/) (App Router), React, Vanilla CSS + Tailwind, Lucide Icons.
- **Backend**: [FastAPI](https://fastapi.tiangolo.com/), SQLAlchemy (SQLite), Uvicorn.
- **AI Models** (via [OpenRouter](https://openrouter.ai/)):
  - `qwen/qwen-2.5-vl-7b-instruct:free`: Vision & Diet Analysis.
  - `qwen/qwen-2.5-vl-7b-instruct:free`: Exercise & Video Analysis.
  - `qwen/qwen3-4b:free`: Complex reasoning & Daily Planning.

---

## ⚙️ Getting Started

### 1. Backend Setup
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Create .env with your OpenRouter API Key
# OPENROUTER_API_KEY=sk-or-v1-...

uvicorn backend.main:app --reload --port 8000
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to see your dashboard.

---

## 📈 Roadmap Status

| Feature | Status | Tech |
| :--- | :---: | :--- |
| **Multimodal Diet Log** | ✅ | Qwen 2.5 VL |
| **Exercise Analysis** | ✅ | Qwen 2.5 VL |
| **Plan Evaluator** | ✅ | Qwen 3.4B |
| **Activity Caching** | ✅ | Custom logic |
| **Email Reporting** | 🚧 | Pending |
| **Wearable Sync** | 📅 | Future |
