CREATE TABLE text_embeddings (
    embed_id BIGSERIAL PRIMARY KEY,
    user_id INT,
    word_id INT,
    text_embedding vector(1536),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (word_id) REFERENCES word_bank(word_id) ON DELETE CASCADE
);




CREATE or REPLACE FUNCTION unique_generated_sentence(
    p_word_id INT,
    p_embedding vector
)
RETURNS BOOLEAN
LANGUAGE PLPGSQL
AS $$
DECLARE
    p_user_id INT;
    is_similar BOOLEAN := FALSE;
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
        WHERE user_id = p_user_id AND word_id = p_word_id AND 1 - (embedding <=> p_embedding) > 0.90
    ) INTO is_similar;

    IF is_similar = FALSE THEN
        INSERT INTO text_embeddings (user_id, word_id, text_embedding) VALUES (p_user_id, p_word_id, p_embedding);
    END IF;

    RETURN is_similar;
END;
$$;