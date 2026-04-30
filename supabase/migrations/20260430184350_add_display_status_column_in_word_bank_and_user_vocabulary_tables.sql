ALTER TABLE word_bank ADD display_status INT NOT NULL DEFAULT 0;
ALTER TABLE user_vocabulary ADD display_status INT NOT NULL DEFAULT 0;

ALTER TABLE word_bank RENAME COLUMN current_interval_days TO curr_duration_days;
ALTER TABLE user_vocabulary RENAME COLUMN prev_interval_days TO next_duration_days;