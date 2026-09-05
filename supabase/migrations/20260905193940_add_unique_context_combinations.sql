INSERT INTO context_combinations (
    activity_id,
    problem_id,
    setting_id
)
SELECT
    a.activity_id,
    p.problem_id,
    s.setting_id
FROM activities a
CROSS JOIN problems p
CROSS JOIN settings s;