import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from io import BytesIO
from services.pdf_service import extract_text_from_pdf
from services.ai_service import summarize_text

load_dotenv()

app = Flask(__name__)
CORS(app)

@app.route('/summarize', methods=['POST'])
def summarize():
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    language = request.form.get('language', 'EN')
    style = request.form.get('style', 'professional')
    
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    if not file.filename.endswith('.pdf'):
        return jsonify({'error': 'Only PDF files are allowed'}), 400
    
    try:
        pdf_bytes = BytesIO(file.read())
        text = extract_text_from_pdf(pdf_bytes)
        
        if not text.strip():
            return jsonify({'error': 'No text found in PDF'}), 400
        
        summary = summarize_text(text, language, style)
        
        return jsonify({'summary': summary}), 200
    
    except Exception as e:
        print(f"ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, debug=True)