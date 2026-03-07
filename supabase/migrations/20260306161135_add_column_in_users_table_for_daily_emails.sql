ALTER TABLE users DROP COLUMN current_vocab_id;
ALTER TABLE users DROP COLUMN vocabulary_dashboard_last_updated;

ALTER TABLE users ADD daily_recall_email BOOLEAN DEFAULT FALSE;