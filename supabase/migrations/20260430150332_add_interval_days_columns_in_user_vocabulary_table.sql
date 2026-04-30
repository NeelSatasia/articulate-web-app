ALTER TABLE word_bank ADD current_interval_days INT NOT NULL DEFAULT 0;
ALTER TABLE word_bank ADD prev_interval_days INT NOT NULL DEFAULT 0;
ALTER TABLE word_bank DROP COLUMN display_status;