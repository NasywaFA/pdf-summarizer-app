export interface PaginationMetadata {
  page: number;
  limit: number;
  totalPages: number;
  totalResults: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMetadata;
  message?: string;
}