import { PaginatedResponse, PaginationMetadata } from "@/types/Pagination";
import { PDFFilterParams, SummaryFilterParams } from "@/types/SummaryType";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

if (!BACKEND_URL) {
  throw new Error("NEXT_PUBLIC_BACKEND_URL is not defined");
}

export const defaultPagination = (
  page: number = 1,
  limit: number = 10
): PaginationMetadata => ({
  page,
  limit,
  totalPages: 0,
  totalResults: 0,
});

const buildQueryString = (params: Record<string, any>): string => {
  const queryParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.append(key, value.toString());
    }
  });
  
  return queryParams.toString();
};

const mapSortToBackend = (sort: string): { sort_by: string; sort_order: string } => {
  switch (sort) {
    case 'newest':
      return { sort_by: 'uploaded_at', sort_order: 'desc' };
    case 'oldest':
      return { sort_by: 'uploaded_at', sort_order: 'asc' };
    case 'name_asc':
      return { sort_by: 'original_name', sort_order: 'asc' };
    case 'name_desc':
      return { sort_by: 'original_name', sort_order: 'desc' };
    default:
      return { sort_by: 'created_at', sort_order: 'desc' };
  }
};

const downloadFile = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};

export const pdfService = {
  async uploadPDF(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${BACKEND_URL}/v1/pdfs/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload PDF');
    }

    return response.json();
  },

  async getAllPDFs() {
    const response = await fetch(`${BACKEND_URL}/v1/pdfs`);

    if (!response.ok) {
      throw new Error('Failed to fetch PDFs');
    }

    return response.json();
  },

  async getPDFsWithFilter(params: PDFFilterParams = {}): Promise<PaginatedResponse<any>> {
    const { sort, date_from, date_to, ...restParams } = params;
    const sortParams = sort ? mapSortToBackend(sort) : {};
    
    const queryParams: Record<string, any> = {
      ...restParams,
      ...sortParams,
    };
  
    if (date_from) queryParams.date_from = date_from;
    if (date_to) queryParams.date_to = date_to;
  
    const queryString = buildQueryString(queryParams);
    const url = `${BACKEND_URL}/v1/pdfs${queryString ? `?${queryString}` : ''}`;
  
    const response = await fetch(url);
  
    if (!response.ok) {
      throw new Error('Failed to fetch PDFs');
    }
  
    return response.json();
  },

  async exportPDFs(format: 'csv' | 'json', params: PDFFilterParams = {}) {
    const { sort, date_from, date_to, ...restParams } = params;
    
    const sortParams = sort ? mapSortToBackend(sort) : {};
    
    const queryParams: Record<string, any> = {
      ...restParams,
      ...sortParams,
      export: format,
    };

    if (date_from) {
      queryParams.date_from = date_from;
    }
    if (date_to) {
      queryParams.date_to = date_to;
    }

    const queryString = buildQueryString(queryParams);
    const url = `${BACKEND_URL}/v1/pdfs?${queryString}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('Failed to export PDFs');
    }

    const blob = await response.blob();
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `pdfs_${timestamp}.${format}`;
    
    downloadFile(blob, filename);
  },

  async getPDFById(id: string) {
    const response = await fetch(`${BACKEND_URL}/v1/pdfs/${id}`);

    if (!response.ok) {
      throw new Error('Failed to fetch PDF');
    }

    return response.json();
  },

  async deletePDF(id: string) {
    const response = await fetch(`${BACKEND_URL}/v1/pdfs/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete PDF');
    }

    return response.json();
  },

  async generateSummary(pdfId: string, language: string, style: string) {
    const response = await fetch(`${BACKEND_URL}/v1/pdfs/${pdfId}/generate`, {
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
    const response = await fetch(`${BACKEND_URL}/v1/pdfs/${pdfId}/summaries`);

    if (!response.ok) {
      throw new Error('Failed to fetch summaries');
    }

    return response.json();
  },

  async getSummariesWithFilter(pdfId: string, params: {
    search?: string;
    sort?: string;
    status?: string;
    language?: string;
    style?: string;
    page?: number;
    limit?: number;
  } = {}) {
    const { sort, page = 1, limit = 10, ...restParams } = params;
    
    const sortParams = sort ? mapSortToBackend(sort) : {};
    
    const queryParams: Record<string, any> = {
      ...restParams,
      ...sortParams,
      page,
      limit,
    };
  
    const queryString = buildQueryString(queryParams);
    
    const url = `${BACKEND_URL}/v1/pdfs/${pdfId}/summaries${queryString ? `?${queryString}` : ""}`;
  
    try {
      const response = await fetch(url);
    
      if (!response.ok) {
        const json = await response.json();
        return {
          isSuccess: false,
          data: [],
          message: json.message || "Failed to fetch summaries",
        };
      }
    
      const json = await response.json();
    
      return {
        isSuccess: true,
        data: json.data || [],
        meta: json.meta || {},
        message: json.message || "Success",
      };
    } catch (error) {
      return {
        isSuccess: false,
        data: [],
        message: (error as Error).message || "Failed to fetch summaries",
      };
    }
  },

  async exportSummaries(pdfId: string, format: 'csv' | 'json', params: SummaryFilterParams = {}) {
    const { sort, ...restParams } = params;
    
    const sortParams = sort ? mapSortToBackend(sort) : {};
    
    const queryParams: Record<string, any> = {
      ...restParams,
      ...sortParams,
      export: format,
    };

    const queryString = buildQueryString(queryParams);
    const url = `${BACKEND_URL}/v1/pdfs/${pdfId}/summaries?${queryString}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('Failed to export summaries');
    }

    const blob = await response.blob();
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `summaries_${timestamp}.${format}`;
    
    downloadFile(blob, filename);
  },

  async getSummaryById(id: string) {
    const response = await fetch(`${BACKEND_URL}/v1/summary/${id}`);

    if (!response.ok) {
      throw new Error('Failed to fetch summary');
    }

    return response.json();
  },

  async updateSummary(id: string, content: string) {
    const response = await fetch(`${BACKEND_URL}/v1/summary/${id}`, {
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
    const response = await fetch(`${BACKEND_URL}/v1/summary/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete summary');
    }

    return response.json();
  },
};