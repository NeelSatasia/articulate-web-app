CREATE OR REPLACE FUNCTION get_daily_dashboard_content(
    target_table TEXT, 
    pk_column TEXT, 
    limit_count INT DEFAULT 5
) 
RETURNS SETOF JSONB 
LANGUAGE plpgsql 
AS $$
DECLARE
    p_user_id INT;
    v_has_active BOOLEAN;
    v_query TEXT;
    v_row_count INT;
BEGIN
    SELECT user_id INTO p_user_id FROM users WHERE user_uid = auth.uid();
    IF p_user_id IS NULL THEN RAISE EXCEPTION 'User not found!'; END IF;

    IF target_table != 'word_bank' AND target_table != 'user_vocabulary' THEN
        RETURN;
    END IF;

    -- Check for "Valid Active" rows (Status 1 AND < 24 hours old)
    EXECUTE format(
        'SELECT EXISTS (
            SELECT 1 FROM %I 
            WHERE user_id = $1 
            AND display_status = 1 
            AND last_updated_at > (NOW() - INTERVAL ''24 hours'')
        )', target_table
    ) USING p_user_id INTO v_has_active;

    -- If valid active rows exist, just return them
    IF v_has_active THEN
        RETURN QUERY EXECUTE format(
            'SELECT to_jsonb(t) FROM %I t WHERE user_id = $1 AND display_status = 1 ORDER BY last_updated_at DESC LIMIT $2', 
            target_table
        ) USING p_user_id, limit_count;
        RETURN;
    END IF;

    -- ROTATION LOGIC (If we reached here, we need new words)
    
    -- Expire current active words (1 -> 0)
    EXECUTE format('UPDATE %I SET display_status = 0 WHERE user_id = $1 AND display_status = 1', target_table) 
    USING p_user_id;

    -- Try to pick new words from the Pool (Status 2)
    EXECUTE format('
        UPDATE %I 
        SET display_status = 1, last_updated_at = NOW() 
        WHERE %I IN (
            SELECT %I FROM %I 
            WHERE user_id = $1 AND display_status = 2 
            ORDER BY RANDOM() 
            LIMIT $2
        )', 
        target_table, pk_column, pk_column, target_table
    ) USING p_user_id, limit_count;

    GET DIAGNOSTICS v_row_count = ROW_COUNT;

    -- If no rows were updated (Pool is empty), Recycle everything (Reset all to 2) and try again
    IF v_row_count = 0 THEN
        -- Reset everything for this user to Status 2 (Pool)
        EXECUTE format('UPDATE %I SET display_status = 2 WHERE user_id = $1', target_table) 
        USING p_user_id;

        -- Retry the update with the freshly recycled pool
        EXECUTE format('
            UPDATE %I 
            SET display_status = 1, last_updated_at = NOW() 
            WHERE %I IN (
                SELECT %I FROM %I 
                WHERE user_id = $1 AND display_status = 2 
                ORDER BY RANDOM() 
                LIMIT $2
            )', 
            target_table, pk_column, pk_column, target_table
        ) USING p_user_id, limit_count;
    END IF;

    -- Return the newly activated rows
    RETURN QUERY EXECUTE format(
        'SELECT to_jsonb(t) FROM %I t WHERE user_id = $1 AND display_status = 1 ORDER BY last_updated_at DESC LIMIT $2', 
        target_table
    ) USING p_user_id, limit_count;
END;
$$;