DROP FUNCTION get_unique_vocabulary_words_for_user(INT, INT);

CREATE OR REPLACE FUNCTION get_unique_vocabulary_words_for_user(p_user_id INT, limit_count INT DEFAULT 3)
RETURNS TABLE (
    vocab_word_id BIGINT,
    word_id BIGINT,
    word TEXT,
    definition TEXT
)
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
    SELECT p_user_id, vw.word_id FROM vocabulary_words vw
    WHERE vw.word_id >= old_vocab_id
    ORDER BY vw.word_id
    LIMIT limit_count;

    RETURN QUERY
    SELECT uv.vocab_word_id, uv.word_id, vw.word, vw.definition
    FROM user_vocabulary uv
    JOIN vocabulary_words vw ON uv.word_id = vw.word_id
    WHERE uv.user_id = p_user_id
    ORDER BY uv.created_at DESC
    LIMIT limit_count;
END;
$$;