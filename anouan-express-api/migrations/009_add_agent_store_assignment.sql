-- ============================================================
-- 009 - Affectation des Agents aux points relais
-- ============================================================

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES stores(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_users_store_id ON users(store_id);
