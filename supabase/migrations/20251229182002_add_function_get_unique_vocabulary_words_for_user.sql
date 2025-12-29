CREATE OR REPLACE FUNCTION get_unique_vocabulary_words_for_user(p_user_id INT, limit_count INT DEFAULT 3)
RETURNS SETOF vocabulary_words
LANGUAGE PLPGSQL
AS $$
DECLARE
    old_vocab_id INT;
BEGIN
    SELECT current_vocab_id
    INTO old_vocab_id
    FROM users
    WHERE user_id = p_user_id;

    UPDATE users
    SET current_vocab_id = old_vocab_id + limit_count
    WHERE user_id = p_user_id;

    INSERT INTO user_vocabulary (user_id, word_id)
    SELECT p_user_id, word_id FROM vocabulary_words
    WHERE word_id >= old_vocab_id
    ORDER BY word_id
    LIMIT limit_count
    RETURNING *;
END;
$$;