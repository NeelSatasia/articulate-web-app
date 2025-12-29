ALTER TABLE users RENAME COLUMN vocabulary_level TO current_vocab_id;
ALTER TABLE users ALTER COLUMN current_vocab_id TYPE INT;
ALTER TABLE users ALTER COLUMN current_vocab_id SET DEFAULT 1;