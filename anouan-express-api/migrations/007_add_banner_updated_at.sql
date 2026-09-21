-- ============================================================
-- 007 - Timestamp de modification des bannières
-- ============================================================

ALTER TABLE banners
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();