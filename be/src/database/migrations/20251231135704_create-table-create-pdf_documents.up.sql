CREATE TABLE pdf_documents (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename      VARCHAR(255)  NOT NULL,
    original_name VARCHAR(255)  NOT NULL,
    file_path     VARCHAR(500)  NOT NULL,
    file_size     BIGINT        NOT NULL,
    mime_type     VARCHAR(100),
    status        VARCHAR(20)   NOT NULL DEFAULT 'pending',
    uploaded_at   TIMESTAMP     DEFAULT NOW(),
    updated_at    TIMESTAMP     DEFAULT NOW(),
    deleted_at    TIMESTAMP,

    CONSTRAINT pdfs_status_check CHECK ( status IN ('pending', 'processing', 'completed', 'completed', 'failed'))
);

CREATE INDEX IF NOT EXISTS idx_pdfs_status ON pdf_documents(status);
CREATE INDEX IF NOT EXISTS idx_pdfs_uploaded_at ON pdf_documents(uploaded_at);