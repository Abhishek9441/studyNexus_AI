import PyPDF2
from PIL import Image
import pytesseract
import os
import re

def extract_text_from_pdf(file_path):
    """Extract text from PDF"""
    text = ""
    with open(file_path, 'rb') as file:
        pdf_reader = PyPDF2.PdfReader(file)
        for page in pdf_reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
    return text

def extract_text_from_image(file_path):
    """Extract text from image using OCR"""
    try:
        image = Image.open(file_path)
        text = pytesseract.image_to_string(image)
        return text
    except Exception as e:
        return f"Error reading image: {str(e)}. Please install Tesseract OCR."

def extract_text_from_txt(file_path):
    """Extract text from TXT file"""
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            return file.read()
    except:
        with open(file_path, 'r', encoding='latin-1') as file:
            return file.read()

def extract_text_from_html(file_path):
    """Extract text from HTML file (strip tags)"""
    text = extract_text_from_txt(file_path)
    clean = re.sub(r'<[^>]+>', ' ', text)
    clean = re.sub(r'\s+', ' ', clean)
    return clean.strip()

def extract_text(file_path, file_extension):
    """Universal text extractor — supports PDF, Image, TXT, HTML"""
    ext = file_extension.lower()

    if ext == '.pdf':
        return extract_text_from_pdf(file_path)
    elif ext in ['.jpg', '.jpeg', '.png', '.bmp', '.gif', '.tiff', '.webp']:
        return extract_text_from_image(file_path)
    elif ext == '.txt':
        return extract_text_from_txt(file_path)
    elif ext in ['.html', '.htm']:
        return extract_text_from_html(file_path)
    else:
        return f"Unsupported file type: {ext}. Supported: PDF, JPG, PNG, TXT, HTML"
