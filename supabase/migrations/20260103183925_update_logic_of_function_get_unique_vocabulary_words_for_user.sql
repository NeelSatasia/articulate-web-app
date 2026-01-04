CREATE OR REPLACE FUNCTION get_unique_vocabulary_words_for_user(limit_count INT DEFAULT 3, force_update BOOLEAN DEFAULT FALSE)
RETURNS SETOF vocabulary_words
LANGUAGE PLPGSQL
AS $$
DECLARE
    current_vocab_id_var INT;
    next_vocab_id INT;
    p_user_id INT;
    last_updated_ts TIMESTAMPTZ;
BEGIN
    SELECT user_id 
    INTO p_user_id 
    FROM users 
    WHERE user_uid = auth.uid();

    IF p_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found!';
    END IF;

    SELECT current_vocab_id, vocabulary_dashboard_last_updated
    INTO current_vocab_id_var, last_updated_ts
    FROM users
    WHERE user_id = p_user_id;

    IF force_update OR (last_updated_ts IS NOT NULL AND NOW() - last_updated_ts >= INTERVAL '24 hour') THEN
        SELECT MAX(word_id)
        INTO next_vocab_id
        FROM (
            SELECT vw.word_id
            FROM vocabulary_words vw
            WHERE vw.word_id >= current_vocab_id_var
            ORDER BY vw.word_id
            LIMIT limit_count
        ) sub;

        UPDATE users
        SET current_vocab_id = (
            SELECT vw.word_id
            FROM vocabulary_words vw
            WHERE vw.word_id > next_vocab_id
            ORDER BY vw.word_id
            LIMIT 1
        ), vocabulary_dashboard_last_updated = NOW()
        WHERE user_id = p_user_id;

        IF FOUND = FALSE THEN
            UPDATE users
            SET current_vocab_id = (
                SELECT MIN(vw.word_id)
                FROM vocabulary_words vw
            ), vocabulary_dashboard_last_updated = NOW()
            WHERE user_id = p_user_id
            RETURNING current_vocab_id INTO current_vocab_id_var;
        END IF;
    END IF;
    
    RETURN QUERY
    SELECT * FROM vocabulary_words vw
    WHERE vw.word_id >= current_vocab_id_var
    ORDER BY vw.word_id
    LIMIT limit_count;
END;
$$;