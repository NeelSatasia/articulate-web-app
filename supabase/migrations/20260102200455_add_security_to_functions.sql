DROP FUNCTION IF EXISTS get_current_dashboard_word_phrases(INT, INT);
DROP FUNCTION IF EXISTS update_word_phrases(INT, INT[], INT[], TEXT[]);
DROP FUNCTION IF EXISTS update_word_categories(INT, INT[], TEXT[]);
DROP FUNCTION IF EXISTS get_unique_vocabulary_words_for_user(INT, INT);


CREATE OR REPLACE FUNCTION get_current_dashboard_word_phrases(limit_count INT DEFAULT 5) 
RETURNS SETOF word_bank 
LANGUAGE PLPGSQL 
AS $$
DECLARE
    current_word_phrase_timestamp TIMESTAMP;
    p_user_id INT;
BEGIN
    SELECT user_id 
    INTO p_user_id 
    FROM users 
    WHERE user_uid = auth.uid();

    IF p_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found!';
    END IF;

    SELECT last_updated_at 
    INTO current_word_phrase_timestamp 
    FROM word_bank 
    WHERE user_id = p_user_id 
    AND display_status = 1 
    LIMIT 1;

    IF current_word_phrase_timestamp IS NOT NULL THEN
        IF NOW() - current_word_phrase_timestamp >= INTERVAL '1 hour' THEN 
            UPDATE word_bank
            SET display_status = 0 
            WHERE user_id = p_user_id 
            AND display_status = 1;

            UPDATE word_bank 
            SET display_status = 1, last_updated_at = NOW()  
            WHERE word_id IN (
                SELECT word_id FROM word_bank 
                WHERE user_id = p_user_id 
                AND display_status = 2 
                ORDER BY RANDOM() 
                LIMIT limit_count
            );

            IF FOUND THEN
                RETURN QUERY 
                SELECT * FROM word_bank 
                WHERE user_id = p_user_id AND display_status = 1 
                ORDER BY last_updated_at DESC 
                LIMIT limit_count;
            ELSE
                UPDATE word_bank 
                SET display_status = 2 
                WHERE user_id = p_user_id;
                
                RETURN QUERY
                UPDATE word_bank 
                SET display_status = 1, last_updated_at = NOW()  
                WHERE word_id IN (
                    SELECT word_id FROM word_bank 
                    WHERE user_id = p_user_id 
                    AND display_status = 2 
                    ORDER BY RANDOM() 
                    LIMIT limit_count
                ) 
                RETURNING *;
            END IF;

        ELSE
            RETURN QUERY 
            SELECT * FROM word_bank 
            WHERE user_id = p_user_id AND display_status = 1 
            ORDER BY last_updated_at DESC 
            LIMIT limit_count;
        END IF;
    ELSE
        RETURN QUERY
        UPDATE word_bank 
        SET display_status = 1, last_updated_at = NOW()  
        WHERE word_id IN (
            SELECT word_id FROM word_bank 
            WHERE user_id = p_user_id 
            AND display_status = 2 
            ORDER BY RANDOM() 
            LIMIT limit_count
        ) 
        RETURNING *;
    END IF;
END;
$$;










CREATE or REPLACE FUNCTION update_word_phrases(
    p_word_ids INT[],
    p_category_ids INT[],
    p_phrases TEXT[]
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    p_user_id INT;
BEGIN

    SELECT user_id 
    INTO p_user_id 
    FROM users 
    WHERE user_uid = auth.uid();

    IF p_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found!';
    END IF;

    UPDATE word_bank wb
    SET 
        word_phrase = updated_data.phrase,
        word_category_id = updated_data.cat_id
    FROM (
        SELECT * FROM unnest(p_word_ids, p_category_ids, p_phrases) 
        AS t(w_id, cat_id, phrase)
    ) AS updated_data
    WHERE 
        wb.word_id = updated_data.w_id 
        AND wb.user_id = p_user_id;
END;
$$;









CREATE or REPLACE FUNCTION update_word_categories(
    p_category_ids INT[],
    p_category_names TEXT[]
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    p_user_id INT;
BEGIN
    SELECT user_id 
    INTO p_user_id 
    FROM users 
    WHERE user_uid = auth.uid();

    IF p_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found!';
    END IF;

    UPDATE word_category wc
    SET word_category = updated_data.cat_name
    FROM (
        SELECT * FROM unnest(p_category_ids, p_category_names) 
        AS t(c_id, cat_name)
    ) AS updated_data
    WHERE 
        wc.word_category_id = updated_data.c_id 
        AND wc.user_id = p_user_id;
END;
$$;








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
    SELECT p_user_id, vw.word_id, MAX(vw.word_id) INTO next_vocab_id FROM vocabulary_words vw
    WHERE vw.word_id >= old_vocab_id
    ORDER BY vw.word_id
    LIMIT limit_count;

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