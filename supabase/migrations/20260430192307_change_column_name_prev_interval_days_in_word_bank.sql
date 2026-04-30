ALTER TABLE word_bank RENAME COLUMN prev_interval_days TO next_duration_days;
ALTER TABLE user_vocabulary RENAME COLUMN current_interval_days TO curr_duration_days;