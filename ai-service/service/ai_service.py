import os
from google import genai
from dotenv import load_dotenv
from service.prompts import PROMPTS

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

def summarize_text(text, language='EN', style='professional'):
    """Generate summary using Gemini AI"""
    prompt_template = PROMPTS.get(style, {}).get(language, PROMPTS['professional']['EN'])
    prompt = f"{prompt_template}{text[:15000]}"
    
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt
    )
    
    return response.text