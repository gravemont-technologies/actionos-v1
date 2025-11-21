-- ============================================================================
-- METRICS SYSTEM TEARDOWN
-- Removes IPP, BUT, and all metrics tracking tables
-- Run this to rollback the metrics system migration
-- ============================================================================

-- Drop indexes first
DROP INDEX IF EXISTS idx_user_daily_metrics_date;
DROP INDEX IF EXISTS idx_user_daily_metrics_profile;
DROP INDEX IF EXISTS idx_step_metrics_step_id;
DROP INDEX IF EXISTS idx_step_metrics_signature;
DROP INDEX IF EXISTS idx_step_metrics_profile;

-- Drop tables
DROP TABLE IF EXISTS user_daily_metrics CASCADE;
DROP TABLE IF EXISTS step_metrics CASCADE;

-- Verification
SELECT 'Metrics system teardown completed' AS status;
