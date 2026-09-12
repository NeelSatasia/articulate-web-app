CREATE TABLE IF NOT EXISTS user_situation_tracker (
    tracker_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    situation TEXT,
    target_word_id INT,
    attempts INT NOT NULL DEFAULT 0
);

ALTER TABLE users DROP COLUMN IF EXISTS daily_recall_email;