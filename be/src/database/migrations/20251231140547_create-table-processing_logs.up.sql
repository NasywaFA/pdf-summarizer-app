CREATE TABLE processing_logs (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	entity_type VARCHAR(50)  NOT NULL,
	entity_id   UUID         NOT NULL,
	action      VARCHAR(100) NOT NULL,
	status      VARCHAR(20)  NOT NULL,
	message     TEXT,
	metadata    JSONB,
	created_at  TIMESTAMP    DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_processing_logs_entity ON processing_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_processing_logs_created_at ON processing_logs(created_at);