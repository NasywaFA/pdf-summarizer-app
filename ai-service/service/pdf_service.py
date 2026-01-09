from PyPDF2 import PdfReader

def extract_text_from_pdf(pdf_file):
    """Extract text from PDF file (BytesIO object)"""
    reader = PdfReader(pdf_file)
    text = ""
    for page in reader.pages:
        extracted = page.extract_text()
        if extracted:
            text += extracted + "\n"
    return text