-- Same effective_date ties are resolved by txn_id. Transaction IDs are only a
-- deterministic fallback, not proof of chronology. A real system should store
-- a timestamp or sequence to make same-day changes unambiguous. For these
-- zero-padded sample IDs, the larger txn_id is treated as the later change.

-- Q1: Latest effective_date per employee, as defined by the assessment.
-- If "current" means as of today, add WHERE effective_date <= CURRENT_DATE
-- inside the CTE. The supplied definition asks simply for the most recent row.
WITH ranked AS (
  SELECT emp_id, emp_name, designation,
         ROW_NUMBER() OVER (
           PARTITION BY emp_id ORDER BY effective_date DESC, txn_id DESC
         ) AS rn
  FROM emp_designation_log
)
SELECT emp_id, emp_name, designation AS current_designation
FROM ranked
WHERE rn = 1
ORDER BY emp_id;

-- Q2: Retain every row, including duplicate same-day entries, because the
-- question explicitly requests every row. The ordering is deterministic.
SELECT emp_id, effective_date,
       LAG(designation) OVER timeline AS previous_designation,
       designation,
       LEAD(designation) OVER timeline AS next_designation
FROM emp_designation_log
WINDOW timeline AS (
  PARTITION BY emp_id ORDER BY effective_date, txn_id
)
ORDER BY emp_id, effective_date, txn_id;

-- Q4: For each allocation, pick the last designation that was effective on
-- or before allocation_start. LEFT JOIN preserves allocations with no prior
-- designation and returns NULL for designation_at_allocation. A separate
-- latest-name lookup supplies the name even if no designation predates the
-- allocation. With no history at all, emp_name also remains NULL.
-- allocation_end does not affect the designation at the START of allocation.
SELECT a.allocation_id, a.emp_id,
       COALESCE(d.emp_name, latest_name.emp_name) AS emp_name,
       a.project_name, a.allocated_role, a.allocation_start,
       d.designation AS designation_at_allocation
FROM emp_allocation_log a
LEFT JOIN LATERAL (
  SELECT h.emp_name, h.designation
  FROM emp_designation_log h
  WHERE h.emp_id = a.emp_id
    AND h.effective_date <= a.allocation_start
  ORDER BY h.effective_date DESC, h.txn_id DESC
  LIMIT 1
) d ON TRUE
LEFT JOIN LATERAL (
  SELECT h.emp_name
  FROM emp_designation_log h
  WHERE h.emp_id = a.emp_id
  ORDER BY h.effective_date DESC, h.txn_id DESC
  LIMIT 1
) latest_name ON TRUE
ORDER BY a.allocation_id;
