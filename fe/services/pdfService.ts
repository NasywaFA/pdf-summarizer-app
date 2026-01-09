const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';

if (!API_URL) {
  throw new Error("NEXT_PUBLIC_BACKEND_SERVICE_URL is not defined");
}

export const pdfService = {
  async uploadPDF(file: File, language: string, style: string) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('language', language);
    formData.append('style', style);

    const response = await fetch(`${API_URL}/v1/pdfs/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload PDF');
    }

    return response.json();
  },

  async getAllPDFs() {
    const response = await fetch(`${API_URL}/v1/pdfs`);

    if (!response.ok) {
      throw new Error('Failed to fetch PDFs');
    }

    return response.json();
  },

  async getPDFById(id: string) {
    const response = await fetch(`${API_URL}/v1/pdfs/${id}`);

    if (!response.ok) {
      throw new Error('Failed to fetch PDF');
    }

    return response.json();
  },

  async deletePDF(id: string) {
    const response = await fetch(`${API_URL}/v1/pdfs/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete PDF');
    }

    return response.json();
  },

  async generateSummary(pdfId: string, language: string, style: string) {
    const response = await fetch(`${API_URL}/v1/pdfs/${pdfId}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ language, style }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate summary');
    }

    return response.json();
  },

  async getSummariesByPDF(pdfId: string) {
    const response = await fetch(`${API_URL}/v1/pdfs/${pdfId}/summaries`);

    if (!response.ok) {
      throw new Error('Failed to fetch summaries');
    }

    return response.json();
  },

  async getSummaryById(id: string) {
    const response = await fetch(`${API_URL}/v1/summary/${id}`);

    if (!response.ok) {
      throw new Error('Failed to fetch summary');
    }

    return response.json();
  },

  async updateSummary(id: string, content: string) {
    const response = await fetch(`${API_URL}/v1/summary/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content }),
    });

    if (!response.ok) {
      throw new Error('Failed to update summary');
    }

    return response.json();
  },

  async deleteSummary(id: string) {
    const response = await fetch(`${API_URL}/v1/summary/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete summary');
    }

    return response.json();
  },
};