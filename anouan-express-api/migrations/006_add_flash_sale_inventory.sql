-- ============================================================
-- 006 - Stock et image des ventes flash
-- ============================================================

ALTER TABLE flash_sales
  ADD COLUMN IF NOT EXISTS stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  ADD COLUMN IF NOT EXISTS image_url TEXT;
