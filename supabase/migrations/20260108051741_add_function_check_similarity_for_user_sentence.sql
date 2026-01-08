CREATE or REPLACE FUNCTION check_similarity_for_user_sentence(
    p_embed_id BIGINT,
    p_embedding vector
)
RETURNS DOUBLE PRECISION
LANGUAGE PLPGSQL
AS $$
DECLARE
    p_user_id INT;
    similarity DOUBLE PRECISION;
BEGIN

    SELECT user_id 
    INTO p_user_id 
    FROM users 
    WHERE user_uid = auth.uid();

    IF p_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found!';
    END IF;

    SELECT 1 - (te.text_embedding <=> p_embedding)
    INTO similarity
    FROM text_embeddings te
    WHERE te.embed_id = p_embed_id AND te.user_id = p_user_id;

    RETURN similarity;
END;
$$;