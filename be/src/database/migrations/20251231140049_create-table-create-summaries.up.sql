CREATE TABLE summaries (
	id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	pdf_id     UUID         NOT NULL,
	content    TEXT,
	language   VARCHAR(10)  NOT NULL,
	style      VARCHAR(20)  NOT NULL,
	status     VARCHAR(20)  NOT NULL DEFAULT 'processing',
	is_edited  BOOLEAN      DEFAULT FALSE,
	metadata   JSONB,
	created_at TIMESTAMP    DEFAULT NOW(),
	updated_at TIMESTAMP    DEFAULT NOW(),
	deleted_at TIMESTAMP,

	CONSTRAINT summaries_status_check CHECK (status IN ('processing', 'completed', 'failed', 'timeout')),
	CONSTRAINT fk_pdf FOREIGN KEY (pdf_id) REFERENCES pdf_documents(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_summaries_pdf_id ON summaries(pdf_id);
CREATE INDEX IF NOT EXISTS idx_summaries_status ON summaries(status);
CREATE INDEX IF NOT EXISTS idx_summaries_created_at ON summaries(created_at);