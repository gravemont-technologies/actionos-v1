-- ============================================================================
-- METRICS SYSTEM MIGRATION
-- Adds IPP, BUT, and secondary metrics tracking
-- Run this after the main schema.sql is applied
-- ============================================================================

-- Step completion metrics (captured when user completes a Step-1)
CREATE TABLE IF NOT EXISTS step_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  step_id UUID NOT NULL REFERENCES active_steps(id) ON DELETE CASCADE,
  profile_id TEXT NOT NULL REFERENCES profiles(profile_id) ON DELETE CASCADE,
  signature TEXT NOT NULL,
  
  -- IPP Components
  ipp_score NUMERIC(10,2),
  magnitude INTEGER CHECK (magnitude >= 1 AND magnitude <= 10),
  reach INTEGER CHECK (reach >= 0),
  depth NUMERIC(3,2) CHECK (depth >= 0.1 AND depth <= 3.0),
  
  -- BUT Components
  but_score NUMERIC(10,2),
  ease_score INTEGER CHECK (ease_score >= 1 AND ease_score <= 10),
  alignment_score INTEGER CHECK (alignment_score >= 1 AND alignment_score <= 10),
  friction_score INTEGER CHECK (friction_score >= 0 AND friction_score <= 10),
  had_unexpected_wins BOOLEAN DEFAULT FALSE,
  unexpected_wins_description TEXT CHECK (LENGTH(unexpected_wins_description) <= 500),
  
  -- Time Tracking
  estimated_minutes INTEGER CHECK (estimated_minutes > 0),
  actual_minutes INTEGER CHECK (actual_minutes > 0),
  taa_score NUMERIC(3,2), -- Calculated: 1 - |est - act| / est
  
  -- Outcome
  outcome_description TEXT CHECK (LENGTH(outcome_description) <= 1000),
  
  -- Timestamps
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Daily aggregated metrics per user
CREATE TABLE IF NOT EXISTS user_daily_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id TEXT NOT NULL REFERENCES profiles(profile_id) ON DELETE CASCADE,
  date DATE NOT NULL,
  
  -- IPP Aggregates
  daily_ipp NUMERIC(10,2) DEFAULT 0,
  seven_day_ipp NUMERIC(10,2) DEFAULT 0,
  thirty_day_ipp NUMERIC(10,2) DEFAULT 0,
  all_time_ipp NUMERIC(10,2) DEFAULT 0,
  
  -- BUT Aggregates (averages)
  daily_but NUMERIC(10,2) DEFAULT 0,
  seven_day_but NUMERIC(10,2) DEFAULT 0,
  thirty_day_but NUMERIC(10,2) DEFAULT 0,
  
  -- Secondary Metrics
  icr NUMERIC(5,2) DEFAULT 0, -- Insight Conversion Rate
  s1sr NUMERIC(5,2) DEFAULT 0, -- Step-1 Success Rate
  rsi NUMERIC(6,2) DEFAULT 0, -- Reality Shift Index (can be negative)
  taa NUMERIC(5,2) DEFAULT 0, -- Time Allocation Accuracy
  hlad NUMERIC(5,2) DEFAULT 0, -- High-Leverage Action Density
  
  -- Counts for diagnostics
  steps_completed INTEGER DEFAULT 0,
  steps_with_impact INTEGER DEFAULT 0,
  high_leverage_steps INTEGER DEFAULT 0,
  insights_created INTEGER DEFAULT 0,
  insights_converted INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(profile_id, date)
);

-- Indexes for metrics queries
CREATE INDEX IF NOT EXISTS idx_step_metrics_profile 
  ON step_metrics(profile_id, completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_step_metrics_signature 
  ON step_metrics(signature);
CREATE INDEX IF NOT EXISTS idx_step_metrics_step_id 
  ON step_metrics(step_id);
CREATE INDEX IF NOT EXISTS idx_user_daily_metrics_profile 
  ON user_daily_metrics(profile_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_user_daily_metrics_date 
  ON user_daily_metrics(date DESC);

-- Disable RLS (service role architecture)
ALTER TABLE step_metrics DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_daily_metrics DISABLE ROW LEVEL SECURITY;

-- Migration complete
SELECT 'Metrics system migration completed' AS status;
