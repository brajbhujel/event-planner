-- Bonus SQL (Q1, Q2, Q4)
-- Same-day ties: order by txn_id as a stable second sort key.


-- Q1 — Current designation per employee
-- Idea: for each emp_id, taking the newest effective_date (txn_id breaks ties).

WITH ranked AS (
  -- Number each employee's rows from newest → oldest
  SELECT
    emp_id,
    emp_name,
    designation,
    ROW_NUMBER() OVER (
      PARTITION BY emp_id
      ORDER BY effective_date DESC, txn_id DESC
    ) AS rn
  FROM emp_designation_log
)
-- Keep only rn = 1 (the current badge)
SELECT
  emp_id,
  emp_name,
  designation AS current_designation
FROM ranked
WHERE rn = 1
ORDER BY emp_id;



-- Q2 — Timeline: previous / current / next designation
-- Idea: LAG = look one row back, LEAD = look one row forward (same emp_id).

SELECT
  emp_id,
  effective_date,
  -- Title on the row just before this one (NULL if first)
  LAG(designation) OVER (
    PARTITION BY emp_id
    ORDER BY effective_date, txn_id
  ) AS previous_designation,
  designation,
  -- Title on the row just after this one (NULL if last)
  LEAD(designation) OVER (
    PARTITION BY emp_id
    ORDER BY effective_date, txn_id
  ) AS next_designation
FROM emp_designation_log
ORDER BY emp_id, effective_date, txn_id;



-- Q4 — Designation held on allocation_start
-- Idea: for each allocation, picking latest designation with effective_date <= allocation_start. If none, designation is NULL.
-- Example: Alice on Project Alpha (2024-02-03) → Associate (not Mid on 02-05).

SELECT
  a.allocation_id,
  a.emp_id,
  -- Prefer name from the active-on-that-date designation;
  -- else any name we know for that employee
  COALESCE(d.emp_name, n.emp_name) AS emp_name,
  a.project_name,
  a.allocated_role,
  a.allocation_start,
  d.designation AS designation_at_allocation
FROM emp_allocation_log a
-- For this allocation row, find the newest designation that already started
LEFT JOIN LATERAL (
  SELECT emp_name, designation
  FROM emp_designation_log
  WHERE emp_id = a.emp_id
    AND effective_date <= a.allocation_start
  ORDER BY effective_date DESC, txn_id DESC
  LIMIT 1
) d ON TRUE
-- Name fallback if they had no designation yet at allocation_start
LEFT JOIN LATERAL (
  SELECT emp_name
  FROM emp_designation_log
  WHERE emp_id = a.emp_id
  ORDER BY effective_date DESC, txn_id DESC
  LIMIT 1
) n ON TRUE
ORDER BY a.allocation_id;
