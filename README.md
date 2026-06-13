# 🧠 StudyNexus AI v2.0

**AI-Powered Smart Study Companion** — Upload any file (PDF, Image, TXT, HTML) and chat with it, generate quizzes, track progress!

## ✨ Features

- 📄 **Multi-File Upload** — PDF, JPG, PNG, TXT, HTML
- 💬 **AI Chat** — Ask questions about your file
- 🎤 **Voice Input** — Speak your questions (Chrome only)
- 📝 **Custom Quiz** — 1 to 100 questions, you choose!
- 📊 **Progress Dashboard** — Track your learning
- 🌙 **Dark/Light Mode** — Toggle themes
- 💾 **History** — All conversations saved
- 🔗 **Share Quiz** — Copy link to share

## 🚀 Quick Start (3 Steps)

1. **Download & Extract** this ZIP
2. **Double-click** `start.bat`
3. **Open** http://localhost:8000 in browser

## 🌐 Deploy Online

### Render.com
1. Push code to GitHub
2. Go to [render.com](https://render.com) → Sign up with GitHub
3. New + → Web Service → Connect repo
4. Start Command: `uvicorn main:app --host 0.0.0.0 --port 10000`
5. Add Environment Variable: `OPENROUTER_API_KEY=your_key`

## 🛠️ Tech Stack

- Backend: Python + FastAPI
- AI: OpenRouter (Gemini, GPT, Llama)
- Database: SQLite (Auto-created)
- Frontend: HTML + CSS + JS

## ❓ Troubleshooting

| Problem | Solution |
|---------|----------|
| Python not found | Install Python 3.11.9, check "Add to PATH" |
| pip install fails | Run `python -m pip install --upgrade pip` first |
| API key invalid | Get new key from [openrouter.ai/keys](https://openrouter.ai/keys) |
| Image OCR fails | Install Tesseract OCR for Windows |

**Made with ❤️**
