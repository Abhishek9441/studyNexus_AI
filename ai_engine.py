import os
import requests
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("GROQ_API_KEY")
if not api_key:
    print("WARNING: GROQ_API_KEY not set!")

GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"

MODELS = [
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant",
    "mixtral-8x7b-32768",
    "gemma-2-9b-it",
]

def call_groq(messages, model_index=0):
    if model_index >= len(MODELS):
        return "Error: All AI models failed. Check API key."
    
    if not api_key:
        return "Error: API key not set."
    
    model = MODELS[model_index]
    
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    data = {
        "model": model,
        "messages": messages,
        "temperature": 0.7,
        "max_tokens": 4000
    }
    
    try:
        print(f"Trying model: {model}")
        response = requests.post(GROQ_URL, headers=headers, json=data, timeout=120)
        
        if response.status_code == 401:
            return "Error: Invalid API key."
        if response.status_code == 429:
            return call_groq(messages, model_index + 1)
        if response.status_code == 402:
            return "Error: Out of credits."
        
        response.raise_for_status()
        result = response.json()
        
        if "choices" in result and len(result["choices"]) > 0:
            print(f"Success with {model}!")
            return result["choices"][0]["message"]["content"]
        else:
            return call_groq(messages, model_index + 1)
            
    except requests.exceptions.Timeout:
        return call_groq(messages, model_index + 1)
    except requests.exceptions.ConnectionError:
        return "Error: No internet connection."
    except Exception as e:
        print(f"Error: {str(e)[:100]}")
        return call_groq(messages, model_index + 1)

def get_answer(context, question):
    context = context[:15000] if len(context) > 15000 else context
    
    content_text = "Context:\n" + context + "\n\nQuestion: " + question + "\n\nAnswer:"
    
    messages = [
        {
            "role": "system",
            "content": "You are StudyNexus AI, a helpful study assistant. Use the provided context to answer questions concisely. Use bullet points for complex answers. If answer not in context, say 'I couldn't find this in the uploaded file.'"
        },
        {
            "role": "user",
            "content": content_text
        }
    ]
    
    return call_groq(messages)

def generate_quiz(context, num_questions=5):
    context = context[:20000] if len(context) > 20000 else context
    
    # STRONGER PROMPT with explicit format
    content_text = """Create EXACTLY """ + str(num_questions) + """ multiple choice questions.

STRICT FORMAT - Each question MUST follow this pattern:

Q: What is...?
A) Option 1
B) Option 2
C) Option 3
D) Option 4
Correct: B

Q: Another question...?
A) Option 1
B) Option 2
C) Option 3
D) Option 4
Correct: A

Text to base questions on:
""" + context + """

Generate """ + str(num_questions) + """ questions NOW:"""
    
    messages = [
        {
            "role": "system",
            "content": "You are an expert quiz creator. Create clear MCQs. ALWAYS use the exact format requested. NEVER add extra text before or after questions."
        },
        {
            "role": "user",
            "content": content_text
        }
    ]
    
    return call_groq(messages)