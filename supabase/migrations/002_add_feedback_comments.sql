-- ============================================================================
-- QUICK MIGRATION: Add feedback_comments table with emoji support
-- ============================================================================
-- Paste this into Supabase SQL Editor to add the feedback_comments table
-- This is a minimal migration - run the full schema.sql for complete setup
-- ============================================================================

-- Create feedback_comments table
CREATE TABLE IF NOT EXISTS feedback_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id TEXT
    REFERENCES profiles(profile_id)
    ON DELETE SET NULL,
  user_id TEXT,
  category TEXT NOT NULL
    CHECK (category IN ('Bugs', 'Improvements', 'Thoughts', 'Secrets 😉')),
  message TEXT NOT NULL
    CHECK (LENGTH(message) >= 1 AND LENGTH(message) <= 5000),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_feedback_comments_profile_id
  ON feedback_comments(profile_id)
  WHERE profile_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_feedback_comments_user_id
  ON feedback_comments(user_id)
  WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_feedback_comments_category
  ON feedback_comments(category);

CREATE INDEX IF NOT EXISTS idx_feedback_comments_created_at
  ON feedback_comments(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_feedback_comments_category_time
  ON feedback_comments(category, created_at DESC);

-- Disable RLS (service role architecture)
ALTER TABLE feedback_comments DISABLE ROW LEVEL SECURITY;

-- Done! Now test the feedback form.
