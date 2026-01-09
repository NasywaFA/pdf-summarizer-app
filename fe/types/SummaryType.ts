export type PDF = {
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