CREATE OR REPLACE FUNCTION get_unique_vocabulary_words_for_user(limit_count INT DEFAULT 3)
RETURNS TABLE (
    vocab_word_id BIGINT,
    word_id INT,
    word TEXT,
    definition TEXT
)
LANGUAGE PLPGSQL
AS $$
DECLARE
    old_vocab_id INT;
    next_vocab_id INT;
    p_user_id INT;
BEGIN
    SELECT user_id 
    INTO p_user_id 
    FROM users 
    WHERE user_uid = auth.uid();

    IF p_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found!';
    END IF;

    SELECT current_vocab_id
    INTO old_vocab_id
    FROM users
    WHERE user_id = p_user_id;

    DELETE FROM user_vocabulary
    WHERE user_id = p_user_id;
    
    INSERT INTO user_vocabulary (user_id, word_id)
    SELECT p_user_id, vw.word_id FROM vocabulary_words vw
    WHERE vw.word_id >= old_vocab_id
    ORDER BY vw.word_id
    LIMIT limit_count;

    SELECT MAX(uv.word_id)
    INTO next_vocab_id
    FROM user_vocabulary uv
    WHERE uv.user_id = p_user_id;

    UPDATE users
    SET current_vocab_id = (
        SELECT vw.word_id
        FROM vocabulary_words vw
        WHERE vw.word_id > next_vocab_id
        ORDER BY vw.word_id
        LIMIT 1
    )
    WHERE user_id = p_user_id;

    IF FOUND = FALSE THEN
        UPDATE users
        SET current_vocab_id = (
            SELECT MIN(vw.word_id)
            FROM vocabulary_words vw
        )
        WHERE user_id = p_user_id;
    END IF;

    RETURN QUERY
    SELECT uv.vocab_word_id, uv.word_id, vw.word, vw.definition
    FROM user_vocabulary uv
    JOIN vocabulary_words vw ON uv.word_id = vw.word_id
    WHERE uv.user_id = p_user_id
    ORDER BY uv.created_at DESC
    LIMIT limit_count;
END;
$$;