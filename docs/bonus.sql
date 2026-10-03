-- Bonus SQL (Q1, Q2, Q4)
-- Same-day ties: order by txn_id as a stable fallback.

-- Q1
-- Current designation = row with the latest effective_date per employee.
WITH ranked AS (
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
SELECT
  emp_id,
  emp_name,
  designation AS current_designation
FROM ranked
WHERE rn = 1
ORDER BY emp_id;


-- Q2
-- For every designation row, show previous and next designation for that employee.
SELECT
  emp_id,
  effective_date,
  LAG(designation) OVER (
    PARTITION BY emp_id
    ORDER BY effective_date, txn_id
  ) AS previous_designation,
  designation,
  LEAD(designation) OVER (
    PARTITION BY emp_id
    ORDER BY effective_date, txn_id
  ) AS next_designation
FROM emp_designation_log
ORDER BY emp_id, effective_date, txn_id;


-- Q4
-- For each allocation, designation that was active on allocation_start
-- = latest designation where effective_date <= allocation_start.
-- If none exists before that date, designation_at_allocation is NULL.
SELECT
  a.allocation_id,
  a.emp_id,
  COALESCE(d.emp_name, n.emp_name) AS emp_name,
  a.project_name,
  a.allocated_role,
  a.allocation_start,
  d.designation AS designation_at_allocation
FROM emp_allocation_log a
LEFT JOIN LATERAL (
  SELECT emp_name, designation
  FROM emp_designation_log
  WHERE emp_id = a.emp_id
    AND effective_date <= a.allocation_start
  ORDER BY effective_date DESC, txn_id DESC
  LIMIT 1
) d ON TRUE
LEFT JOIN LATERAL (
  -- name fallback if no designation existed yet at allocation_start
  SELECT emp_name
  FROM emp_designation_log
  WHERE emp_id = a.emp_id
  ORDER BY effective_date DESC, txn_id DESC
  LIMIT 1
) n ON TRUE
ORDER BY a.allocation_id;
