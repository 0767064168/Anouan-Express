-- ============================================================
-- 008 - Champs d'affichage des bannières
-- ============================================================

ALTER TABLE banners
  ADD COLUMN IF NOT EXISTS subtitle TEXT,
  ADD COLUMN IF NOT EXISTS badge VARCHAR(100),
  ADD COLUMN IF NOT EXISTS theme_color VARCHAR(100),
  ADD COLUMN IF NOT EXISTS product_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS product_price NUMERIC(12,0),
  ADD COLUMN IF NOT EXISTS product_old_price NUMERIC(12,0),
  ADD COLUMN IF NOT EXISTS category VARCHAR(100);