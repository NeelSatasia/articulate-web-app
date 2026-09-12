CREATE OR REPLACE FUNCTION increment_situation_attempts()
RETURNS TABLE (
    situation TEXT,
    target_word_id INT,
    attempts INT,
    word_bank jsonb
)
LANGUAGE plpgsql
AS $$
DECLARE
    p_user_id INT;
BEGIN
    SELECT user_id 
    INTO p_user_id 
    FROM users 
    WHERE user_uid = auth.uid();

    RETURN QUERY
    UPDATE user_situation_tracker ust
    SET attempts = ust.attempts + 1
    WHERE ust.target_word_id IS NOT NULL
      AND ust.situation IS NOT NULL
    RETURNING
        ust.situation,
        ust.target_word_id,
        ust.attempts,
        (
            SELECT to_jsonb(wb)
            FROM word_bank wb
            WHERE wb.word_id = ust.target_word_id
        );
END;
$$;