CREATE OR REPLACE FUNCTION update_user_ai_usage()
RETURNS INT
LANGUAGE plpgsql
AS $$
DECLARE
    p_user_id INT;
    new_usage INT;
BEGIN
    SELECT user_id 
    INTO p_user_id 
    FROM users 
    WHERE user_uid = auth.uid();

    IF p_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found!';
    END IF;

    UPDATE users
    SET ai_usage_tracker = ai_usage_tracker + 1
    WHERE user_id = p_user_id
      AND ai_usage_tracker < 50
    RETURNING ai_usage_tracker INTO new_usage;

    RETURN new_usage;
END;
$$;