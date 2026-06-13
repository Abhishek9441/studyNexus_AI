import sqlite3
from datetime import datetime

DB_NAME = "studynexus.db"

def init_db():
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()

    c.execute('''CREATE TABLE IF NOT EXISTS chats
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  user_id TEXT,
                  file_id TEXT,
                  file_name TEXT,
                  question TEXT,
                  answer TEXT,
                  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP)''')

    c.execute('''CREATE TABLE IF NOT EXISTS quiz_results
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  user_id TEXT,
                  file_id TEXT,
                  score INTEGER,
                  total INTEGER,
                  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP)''')

    c.execute('''CREATE TABLE IF NOT EXISTS progress
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  user_id TEXT,
                  pdfs_uploaded INTEGER DEFAULT 0,
                  questions_asked INTEGER DEFAULT 0,
                  quizzes_taken INTEGER DEFAULT 0,
                  total_score INTEGER DEFAULT 0,
                  last_active DATETIME DEFAULT CURRENT_TIMESTAMP)''')

    conn.commit()
    conn.close()

def save_chat(user_id, file_id, file_name, question, answer):
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    c.execute("INSERT INTO chats (user_id, file_id, file_name, question, answer) VALUES (?, ?, ?, ?, ?)",
              (user_id, file_id, file_name, question, answer))
    conn.commit()
    conn.close()

def get_chat_history(user_id):
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    c.execute("SELECT question, answer, timestamp, file_name FROM chats WHERE user_id = ? ORDER BY timestamp DESC LIMIT 50", (user_id,))
    rows = c.fetchall()
    conn.close()
    return [{"question": r[0], "answer": r[1], "timestamp": r[2], "file_name": r[3]} for r in rows]

def save_quiz_result(user_id, file_id, score, total):
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    c.execute("INSERT INTO quiz_results (user_id, file_id, score, total) VALUES (?, ?, ?, ?)",
              (user_id, file_id, score, total))
    conn.commit()
    conn.close()

def get_quiz_stats(user_id):
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    c.execute("SELECT COUNT(*), SUM(score), SUM(total) FROM quiz_results WHERE user_id = ?", (user_id,))
    row = c.fetchone()
    conn.close()
    return {"quizzes_taken": row[0] or 0, "total_score": row[1] or 0, "total_questions": row[2] or 0}

def update_progress(user_id, pdfs=0, questions=0, quizzes=0, score=0):
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    c.execute("SELECT * FROM progress WHERE user_id = ?", (user_id,))
    if c.fetchone() is None:
        c.execute("INSERT INTO progress (user_id, pdfs_uploaded, questions_asked, quizzes_taken, total_score) VALUES (?, ?, ?, ?, ?)",
                  (user_id, pdfs, questions, quizzes, score))
    else:
        c.execute("""UPDATE progress SET pdfs_uploaded = pdfs_uploaded + ?, questions_asked = questions_asked + ?,
                     quizzes_taken = quizzes_taken + ?, total_score = total_score + ?,
                     last_active = CURRENT_TIMESTAMP WHERE user_id = ?""",
                  (pdfs, questions, quizzes, score, user_id))
    conn.commit()
    conn.close()

def get_progress(user_id):
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    c.execute("SELECT pdfs_uploaded, questions_asked, quizzes_taken, total_score FROM progress WHERE user_id = ?", (user_id,))
    row = c.fetchone()
    conn.close()
    if row:
        return {"pdfs_uploaded": row[0], "questions_asked": row[1], "quizzes_taken": row[2], "total_score": row[3]}
    return {"pdfs_uploaded": 0, "questions_asked": 0, "quizzes_taken": 0, "total_score": 0}
