DROP FUNCTION unique_generated_sentence(INT, vector)

CREATE or REPLACE FUNCTION unique_generated_sentence(
    p_word_id INT,
    p_embedding vector
)
RETURNS BIGINT
LANGUAGE PLPGSQL
AS $$
DECLARE
    p_user_id INT;
    is_similar BOOLEAN := FALSE;
    final_embed_id BIGINT := -1;
BEGIN

    SELECT user_id 
    INTO p_user_id 
    FROM users 
    WHERE user_uid = auth.uid();

    IF p_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found!';
    END IF;

    SELECT EXISTS (
        SELECT 1
        FROM text_embeddings
        WHERE user_id = p_user_id AND word_id = p_word_id AND 1 - (text_embedding <=> p_embedding) > 0.90
    ) INTO is_similar;

    IF is_similar = FALSE THEN
        INSERT INTO text_embeddings (user_id, word_id, text_embedding) VALUES (p_user_id, p_word_id, p_embedding)
        RETURNING embed_id INTO final_embed_id;
    END IF;

    RETURN final_embed_id;
END;
$$;