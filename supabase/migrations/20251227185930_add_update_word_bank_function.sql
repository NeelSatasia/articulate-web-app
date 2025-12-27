CREATE or REPLACE FUNCTION update_word_phrases(
    p_user_id INT,
    p_word_ids INT[],
    p_category_ids INT[],
    p_phrases TEXT[]
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
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
    p_user_id INT,
    p_category_ids INT[],
    p_category_names TEXT[]
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
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