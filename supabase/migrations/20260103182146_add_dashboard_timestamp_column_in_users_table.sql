ALTER TABLE users ADD COLUMN vocabulary_dashboard_last_updated TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE user_vocabulary DROP COLUMN IF EXISTS created_at;