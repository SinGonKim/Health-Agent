import os
import httpx
import base64
import json
import re
from fastapi import HTTPException

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
# Using a model that supports visual inputs nicely. 
# If Molmo (allenai/molmo-7b-d-0924) is unstable, we might fallback to gpt-4o logic, but keeping Molmo for now.
MODEL_ID = "qwen/qwen-2.5-vl-7b-instruct:free"
TEXT_MODEL_ID = "qwen/qwen3-4b:free"

def extract_json(text: str):
    """Robustly extract JSON from a string that might contain markdown or other text."""
    # Try finding JSON block
    match = re.search(r'\{.*\}', text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(0))
        except json.JSONDecodeError:
            pass
    
    # If no match or decode failed, try cleaner version
    clean_text = text.replace("```json", "").replace("```", "").strip()
    try:
        return json.loads(clean_text)
    except json.JSONDecodeError:
        # Last resort: just try to find anything that looks like JSON
        raise ValueError(f"Could not parse JSON from response: {text}")


async def get_youtube_thumbnail(text_input: str):
    """Detects YouTube URL and returns thumbnail bytes if found."""
    # Simple regex for youtube ID
    youtube_regex = (
        r'(https?://)?(www\.)?'
        r'(youtube|youtu|youtube-nocookie)\.(com|be)/'
        r'(watch\?v=|embed/|v/|.+\?v=)?([^&=%\?]{11})'
    )
    match = re.search(youtube_regex, text_input)
    if not match:
        return None
    
    video_id = match.group(6)
    thumbnail_url = f"https://img.youtube.com/vi/{video_id}/maxresdefault.jpg"
    
    # Fallback to hqdefault if maxres doesn't exist (handled by checking response size or status, but simplified here)
    async with httpx.AsyncClient() as client:
        resp = await client.get(thumbnail_url)
        if resp.status_code == 200:
            return resp.content
        
        # Fallback
        resp = await client.get(f"https://img.youtube.com/vi/{video_id}/0.jpg")
        return resp.content if resp.status_code == 200 else None

async def analyze_diet_image(image_bytes: bytes = None, mime_type: str = "image/jpeg", text_input: str = ""):
    if not OPENROUTER_API_KEY:
        return {
            "items": [{"name": "Mock Food (No Key)", "kcal": 0, "carbs": 0, "protein": 0, "fat": 0}], 
            "total_kcal": 0, 
            "advice": f"Mock Advice (Text: {text_input})"
        }

    # Prepare Vision Input
    data_url = None
    if image_bytes:
        base64_image = base64.b64encode(image_bytes).decode("utf-8")
        data_url = f"data:{mime_type};base64,{base64_image}"

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "VibeHealth",
    }

    user_note = f"User Note: {text_input}" if text_input else ""
    prompt = f"""
    You are a nutrition expert AI. Analyze this input (Image and/or Text).
    {user_note}
    If image is present, identify food items and estimate calories.
    If only text is present, estimate calories based on the description.
    
    Return ONLY a valid JSON object:
    {{
        "items": [
            {{"name": "Food Name", "kcal": 100, "carbs": 10, "protein": 5, "fat": 2}}
        ],
        "total_kcal": 100,
        "advice": "Short nutritional advice for this meal."
    }}
    """
    
    messages = [{"role": "user", "content": []}]
    if data_url:
        messages[0]["content"].append({"type": "image_url", "image_url": {"url": data_url}})
    messages[0]["content"].append({"type": "text", "text": prompt})

    payload = {
        "model": MODEL_ID,
        "messages": messages
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(OPENROUTER_URL, headers=headers, json=payload, timeout=60.0)
            if response.status_code != 200:
                print(f"OpenRouter Error {response.status_code}: {response.text}")
                raise HTTPException(status_code=response.status_code, detail=f"AI service error: {response.text}")
            
            result = response.json()
            if "choices" not in result or not result["choices"]:
                raise ValueError(f"No choices returned from AI: {result}")
            content = result["choices"][0]["message"]["content"]
            return extract_json(content)
        except Exception as e:
            print(f"Error calling OpenRouter Diet: {e}")
            raise HTTPException(status_code=500, detail=str(e))

async def analyze_exercise_media(image_bytes: bytes = None, mime_type: str = "image/jpeg", text_input: str = ""):
    if not OPENROUTER_API_KEY:
        return {
            "exercise_type": "Mock Squat (No Key)",
            "feedback": f"Text input: {text_input}",
            "recommendation": "Mock Recommendation"
        }

    # 1. Handle YouTube URL in text
    if not image_bytes and text_input:
        yt_thumbnail = await get_youtube_thumbnail(text_input)
        if yt_thumbnail:
            image_bytes = yt_thumbnail
            mime_type = "image/jpeg"
            text_input += " (Analyzed via YouTube Thumbnail)"

    # 2. Prepare Data URL
    data_url = None
    if image_bytes:
        base64_data = base64.b64encode(image_bytes).decode("utf-8")
        data_url = f"data:{mime_type};base64,{base64_data}"

    # 3. Validation: Need at least one source
    if not data_url and not text_input:
         raise HTTPException(status_code=400, detail="Provide image, video, or text description.")

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "VibeHealth",
    }

    user_text_prompt = f"User Note: {text_input}" if text_input else ""
    prompt = f"""
    You are a professional fitness coach using Vision AI. Analyze this input.
    {user_text_prompt}
    1. Identify the exercise type.
    2. Analyze the form/posture (if visual provided).
    3. Recommend a workout plan.
    
    Return ONLY a valid JSON object:
    {{
        "exercise_type": "Squat",
        "feedback": "Your knees are caving inward slightly.",
        "recommendation": "Perform 3 sets of 12 reps."
    }}
    """

    messages = [{"role": "user", "content": []}]
    if data_url:
        messages[0]["content"].append({"type": "image_url", "image_url": {"url": data_url}})
    messages[0]["content"].append({"type": "text", "text": prompt})

    payload = {
        "model": MODEL_ID,
        "messages": messages
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(OPENROUTER_URL, headers=headers, json=payload, timeout=60.0)
            if response.status_code != 200:
                print(f"OpenRouter Error {response.status_code}: {response.text}")
                raise HTTPException(status_code=response.status_code, detail=f"AI service error: {response.text}")

            result = response.json()
            if "choices" not in result or not result["choices"]:
                raise ValueError(f"No choices returned from AI: {result}")
            content = result["choices"][0]["message"]["content"]
            return extract_json(content)
        except Exception as e:
            print(f"Error calling OpenRouter Exercise: {e}")
            raise HTTPException(status_code=500, detail=str(e))

async def evaluate_user_plan(user_plan: str, diet_history_text: str, exercise_history_text: str):
    if not OPENROUTER_API_KEY:
        return {
            "verdict": "Good",
            "pros": "균형 있는 계획입니다.",
            "cons": "특별한 문제점이 없습니다.",
            "advice": "계획대로 진행해 보세요!"
        }

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "VibeHealth",
    }

    # Use fallback if history is empty
    diet_text = diet_history_text if diet_history_text.strip() else "최근 식단 기록이 없습니다."
    ex_text = exercise_history_text if exercise_history_text.strip() else "최근 운동 기록이 없습니다."

    prompt = f"""
    You are a professional health consultant AI. Evaluate the user's plan based on their history.
    
    User's New Plan:
    {user_plan}

    Diet History (Last 5 records):
    {diet_text}
    
    Exercise History (Last 5 records):
    {ex_text}

    Return ONLY a valid JSON object in this format (in Korean):
    {{
        "verdict": "Great / Good / Risky / Bad",
        "pros": "Advantages of this plan",
        "cons": "Potential issues or risks",
        "advice": "General advice or improvement tips"
    }}
    """

    payload = {
        "model": TEXT_MODEL_ID,
        "messages": [{"role": "user", "content": [{"type": "text", "text": prompt}]}]
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(OPENROUTER_URL, headers=headers, json=payload, timeout=60.0)
            if response.status_code != 200:
                error_detail = response.text
                try:
                    error_json = response.json()
                    msg = error_json.get("error", {}).get("message", "")
                    code = error_json.get("error", {}).get("code")
                    
                    if code == 402 or "limit exceeded" in msg.lower():
                        error_detail = "OpenRouter API 키의 지출 한도(USD Spend Limit)를 초과했습니다. OpenRouter 설정에서 키 한도를 확인해주세요."
                    elif "rate limit" in msg.lower() or "429" in msg:
                        error_detail = "AI 서비스 사용량이 많아 잠시 후 다시 시도해주세요. (Rate Limit)"
                    elif "token" in msg.lower():
                        error_detail = "입력 내용이 너무 길어 처리할 수 없습니다. (Token Limit)"
                    else:
                        error_detail = msg or error_detail
                except:
                    pass
                print(f"OpenRouter Error {response.status_code}: {error_detail}")
                raise HTTPException(status_code=response.status_code, detail=error_detail)
            
            result = response.json()
            if "choices" not in result or not result["choices"]:
                raise ValueError(f"No choices returned from AI: {result}")
            content = result["choices"][0]["message"]["content"]
            return extract_json(content)
        except Exception as e:
            print(f"Error calling OpenRouter Evaluation: {e}")
            raise HTTPException(status_code=500, detail=str(e))

async def generate_daily_recommendations(diet_history_text: str, exercise_history_text: str):
    if not OPENROUTER_API_KEY:
        return {
            "meal": "닭가슴살 샐러드",
            "workout": "30분 조깅"
        }


    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "VibeHealth",
    }

    prompt = f"""
    You are a professional health coach. Based on the user's history, suggest ONE meal and ONE workout for today in Korean.
    Keep it very concise.
    
    Diet History (Last records):
    {diet_history_text}
    
    Exercise History (Last records):
    {exercise_history_text}

    Return ONLY a valid JSON object in this format (in Korean):
    {{
        "meal": "오늘의 추천 식단 이름",
        "workout": "오늘의 추천 운동 명칭"
    }}
    """

    payload = {
        "model": TEXT_MODEL_ID,
        "messages": [{"role": "user", "content": [{"type": "text", "text": prompt}]}]
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(OPENROUTER_URL, headers=headers, json=payload, timeout=60.0)
            if response.status_code != 200:
                print(f"OpenRouter Error {response.status_code}: {response.text}")
                raise HTTPException(status_code=response.status_code, detail=f"AI service error: {response.text}")
            
            result = response.json()
            if "choices" not in result or not result["choices"]:
                raise ValueError(f"No choices returned from AI: {result}")
            content = result["choices"][0]["message"]["content"]
            return extract_json(content)
        except Exception as e:
            print(f"Error calling OpenRouter Daily Recommendation: {e}")
            raise HTTPException(status_code=500, detail=str(e))


