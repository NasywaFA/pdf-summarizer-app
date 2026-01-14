export type PDF = {
    URL: any;
    id: string;
    filename: string;
    original_name: string;
    file_path: string;
    file_size: number;
    mime_type: string;
    language: string;
    style: string;
    status: string;
    uploaded_at: string;
    updated_at: string;
};

export type SummaryType = {
    id: string;
    pdf_id: string;
    content: string;
    language: string;
    style: string;
    status: string;
    is_edited: boolean;
    created_at: string;
    updated_at: string;
};

export type APIResponse<T> = {
    success: boolean;
    message: string;
    data: T;
};

export interface PDFFilterParams {
  search?: string;
  sort?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
  status?: string;
}

export interface SummaryFilterParams {
  search?: string;
  sort?: string;
  status?: string;
  language?: string;
  style?: string;
  page?: number;
  limit?: number;
}