DROP TABLE IF EXISTS user_situation_tracker;

ALTER TABLE users ADD COLUMN situation TEXT, ADD COLUMN target_word_id INT REFERENCES word_bank(word_id), ADD COLUMN attempts INT DEFAULT 0;