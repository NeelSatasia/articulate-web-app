ALTER TABLE vocabulary_words DROP COLUMN frequency_score;
ALTER TABLE vocabulary_words ADD word_level INT;

TRUNCATE TABLE vocabulary_words RESTART IDENTITY CASCADE;