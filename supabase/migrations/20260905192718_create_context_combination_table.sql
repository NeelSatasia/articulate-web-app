CREATE TABLE context_combinations (
    combination_id BIGSERIAL PRIMARY KEY,
    activity_id BIGINT NOT NULL REFERENCES activities(activity_id),
    problem_id BIGINT NOT NULL REFERENCES problems(problem_id),
    setting_id BIGINT NOT NULL REFERENCES settings(setting_id),

    UNIQUE (activity_id, problem_id, setting_id)
);