CREATE TABLE IF NOT EXISTS user_vocabulary (
    vocab_word_id BIGSERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    word_id INT,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (word_id) REFERENCES vocabulary_words(word_id) ON DELETE CASCADE
);