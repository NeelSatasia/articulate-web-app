ALTER DATABASE postgres SET timezone='UTC';

CREATE OR REPLACE FUNCTION get_current_dashboard_word_phrases(user_id UUID, limit_count INT DEFAULT 5) 
RETURNS SETOF word_bank 
LANGUAGE PLPGSQL 
AS $$
DECLARE
    current_word_phrase_timestamp TIMESTAMP;
BEGIN 
    SELECT last_updated_at 
    INTO current_word_phrase_timestamp 
    FROM word_bank 
    WHERE user_id = user_id 
    AND display_status = 1 
    LIMIT 1;

    IF current_word_phrase_timestamp IS NOT NULL THEN
        IF NOW() - word_phrase_timestamp >= INTERVAL '1 hour' THEN 
            UPDATE word_bank
            SET display_status = 0 
            WHERE user_id = user_id 
            AND display_status = 1;

            UPDATE word_bank 
            SET display_status = 1, last_updated_at = NOW()  
            WHERE word_id IN (
                SELECT word_id FROM word_bank 
                WHERE user_id = user_id 
                AND display_status = 2 
                ORDER BY RANDOM() 
                LIMIT limit_count
            );

            IF FOUND THEN
                RETURN QUERY 
                SELECT * FROM word_bank 
                WHERE user_id = user_id AND display_status = 1 
                ORDER BY last_updated_at DESC 
                LIMIT limit_count;
            ELSE
                UPDATE word_bank 
                SET display_status = 2 
                WHERE user_id = user_id;
                
                RETURN QUERY
                UPDATE word_bank 
                SET display_status = 1, last_updated_at = NOW()  
                WHERE word_id IN (
                    SELECT word_id FROM word_bank 
                    WHERE user_id = user_id 
                    AND display_status = 2 
                    ORDER BY RANDOM() 
                    LIMIT limit_count
                ) 
                RETURNING *;
            END IF;

        ELSE
            RETURN QUERY 
            SELECT * FROM word_bank 
            WHERE user_id = user_id AND display_status = 1 
            ORDER BY last_updated_at DESC 
            LIMIT limit_count;
        END IF;
    ELSE
        RETURN QUERY
        UPDATE word_bank 
        SET display_status = 1, last_updated_at = NOW()  
        WHERE word_id IN (
            SELECT word_id FROM word_bank 
            WHERE user_id = user_id 
            AND display_status = 2 
            ORDER BY RANDOM() 
            LIMIT limit_count
        ) 
        RETURNING *;
    END IF;
END;
$$