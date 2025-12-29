ALTER TABLE word_bank DROP COLUMN IF EXISTS vocabulary_level;
ALTER TABLE users ADD COLUMN vocabulary_level REAL DEFAULT 4.19;