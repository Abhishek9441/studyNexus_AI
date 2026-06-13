from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os
import uuid
import uvicorn
from pdf_handler import extract_text
from ai_engine import get_answer, generate_quiz
from database import init_db, save_chat, get_chat_history, save_quiz_result, get_quiz_stats, update_progress, get_progress

app = FastAPI(title="StudyNexus AI", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("uploads", exist_ok=True)
init_db()

app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
async def root():
    return FileResponse("static/index.html")

@app.get("/health")
async def health_check():
    return {"status": "healthy", "message": "StudyNexus AI is running!"}

@app.post("/upload-file")
async def upload_file(file: UploadFile = File(...)):
    try:
        file_ext = os.path.splitext(file.filename)[1].lower()
        allowed_exts = ['.pdf', '.jpg', '.jpeg', '.png', '.txt', '.html', '.htm']

        if file_ext not in allowed_exts:
            return {"error": f"Unsupported: {file_ext}. Allowed: {', '.join(allowed_exts)}"}

        content = await file.read()
        if len(content) > 50 * 1024 * 1024:
            return {"error": "File too large! Max 50MB."}

        file_id = str(uuid.uuid4())
        file_path = f"uploads/{file_id}{file_ext}"

        with open(file_path, "wb") as f:
            f.write(content)

        text = extract_text(file_path, file_ext)

        if not text or len(text.strip()) == 0:
            os.remove(file_path)
            return {"error": "Could not extract text. Try another file."}

        return {
            "success": True,
            "file_id": file_id,
            "file_type": file_ext,
            "text_preview": text[:500] + "...",
            "total_chars": len(text),
            "message": f"{file.filename} uploaded! ({len(text)} chars)"
        }

    except Exception as e:
        return {"error": f"Upload failed: {str(e)}"}

@app.post("/chat")
async def chat(file_id: str = Form(...), file_name: str = Form(""), question: str = Form(...), user_id: str = Form("default")):
    try:
        files = os.listdir("uploads")
        file_path = None
        for f in files:
            if f.startswith(file_id):
                file_path = f"uploads/{f}"
                break

        if not file_path or not os.path.exists(file_path):
            return {"error": "File not found. Upload again."}

        file_ext = os.path.splitext(file_path)[1]
        text = extract_text(file_path, file_ext)

        if not text:
            return {"error": "Could not read file."}

        answer = get_answer(text, question)

        if not answer.startswith("Error"):
            save_chat(user_id, file_id, file_name, question, answer)
            update_progress(user_id, questions=1)

        return {"success": True, "answer": answer}

    except Exception as e:
        return {"error": f"Chat error: {str(e)}"}

@app.get("/history/{user_id}")
async def history(user_id: str):
    try:
        return get_chat_history(user_id)
    except Exception as e:
        return {"error": str(e)}

@app.post("/generate-quiz")
async def create_quiz(file_id: str = Form(...), num_questions: int = Form(5)):
    try:
        if num_questions < 1 or num_questions > 100:
            return {"error": "Questions must be between 1 and 100"}

        files = os.listdir("uploads")
        file_path = None
        for f in files:
            if f.startswith(file_id):
                file_path = f"uploads/{f}"
                break

        if not file_path or not os.path.exists(file_path):
            return {"error": "File not found."}

        file_ext = os.path.splitext(file_path)[1]
        text = extract_text(file_path, file_ext)

        if not text:
            return {"error": "Could not read file."}

        quiz = generate_quiz(text, num_questions)

        if quiz.startswith("Error"):
            return {"error": quiz}

        return {"success": True, "quiz": quiz}

    except Exception as e:
        return {"error": f"Quiz error: {str(e)}"}

@app.post("/submit-quiz")
async def submit_quiz(user_id: str = Form(...), file_id: str = Form(""), score: int = Form(...), total: int = Form(...)):
    try:
        save_quiz_result(user_id, file_id, score, total)
        update_progress(user_id, quizzes=1, score=score)
        return {"success": True, "score": score, "total": total}
    except Exception as e:
        return {"error": str(e)}

@app.get("/progress/{user_id}")
async def progress(user_id: str):
    try:
        return get_progress(user_id)
    except Exception as e:
        return {"error": str(e)}

@app.get("/quiz-stats/{user_id}")
async def quiz_stats(user_id: str):
    try:
        return get_quiz_stats(user_id)
    except Exception as e:
        return {"error": str(e)}


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
