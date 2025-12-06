CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    user_name VARCHAR(30),
    user_email VARCHAR(255) UNIQUE NOT NULL
);

CREATE TABLE word_category (
    word_category_id BIGSERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    word_category VARCHAR(255) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE (user_id, word_category)
);

CREATE TABLE word_bank (
    word_id BIGSERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    word_phrase VARCHAR(255) NOT NULL,
    word_category_id BIGSERIAL NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (word_category_id) REFERENCES word_category(word_category_id) ON DELETE CASCADE,
    UNIQUE (user_id, word_category_id, word_phrase)
);