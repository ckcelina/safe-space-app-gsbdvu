-- Performance Indexes for Safe Space App
-- Run this in Supabase SQL Editor to improve query performance

-- ═══════════════════════════════════════════════════════════════════
-- MESSAGES TABLE INDEXES
-- ═══════════════════════════════════════════════════════════════════

-- Index for faster message queries by person (used in chat screen)
-- Speeds up: SELECT * FROM messages WHERE person_id = ? ORDER BY created_at
CREATE INDEX IF NOT EXISTS idx_messages_person_created
ON messages(person_id, created_at DESC);

-- Index for user's messages (used in various queries)
CREATE INDEX IF NOT EXISTS idx_messages_user_created
ON messages(user_id, created_at DESC);

-- Index for subject filtering (used in chat when filtering by subject)
CREATE INDEX IF NOT EXISTS idx_messages_person_subject
ON messages(person_id, subject);

-- Composite index for efficient last message queries
CREATE INDEX IF NOT EXISTS idx_messages_user_person_created
ON messages(user_id, person_id, created_at DESC);

-- ═══════════════════════════════════════════════════════════════════
-- PERSONS TABLE INDEXES
-- ═══════════════════════════════════════════════════════════════════

-- Index for sorting persons by activity (used in home screen)
-- NULLS LAST ensures persons without activity appear at the end
CREATE INDEX IF NOT EXISTS idx_persons_user_activity
ON persons(user_id, last_activity_at DESC NULLS LAST);

-- Index for filtering by relationship type (used to separate people vs topics)
CREATE INDEX IF NOT EXISTS idx_persons_user_relationship
ON persons(user_id, relationship_type);

-- ═══════════════════════════════════════════════════════════════════
-- ANALYZE TABLES (Update statistics for query planner)
-- ═══════════════════════════════════════════════════════════════════

ANALYZE messages;
ANALYZE persons;

-- ═══════════════════════════════════════════════════════════════════
-- VERIFICATION QUERY
-- ═══════════════════════════════════════════════════════════════════

-- Run this to verify indexes were created:
-- SELECT indexname, tablename FROM pg_indexes WHERE tablename IN ('messages', 'persons') ORDER BY tablename, indexname;
