DROP TABLE IF EXISTS prompts;
DROP TABLE IF EXISTS user_vocabulary;

ALTER TABLE word_bank DROP COLUMN embedding, DROP COLUMN curr_duration_days, DROP COLUMN next_duration_days, DROP COLUMN display_status;
ALTER TABLE vocabulary_words DROP COLUMN embedding;