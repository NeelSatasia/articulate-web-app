ALTER TABLE user_vocabulary DROP COLUMN last_updated_at;
ALTER TABLE word_bank DROP COLUMN last_updated_at;

DROP FUNCTION IF EXISTS get_daily_dashboard_content(TEXT, TEXT, INT);