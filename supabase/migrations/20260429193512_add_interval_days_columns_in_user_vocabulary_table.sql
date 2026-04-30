ALTER TABLE user_vocabulary ADD current_interval_days INT NOT NULL DEFAULT 0;
ALTER TABLE user_vocabulary ADD prev_interval_days INT NOT NULL DEFAULT 0;
ALTER TABLE user_vocabulary DROP COLUMN display_status;