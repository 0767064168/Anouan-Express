-- ============================================================
-- 003 — Ajout des champs flash sale aux produits
-- ============================================================

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS flash_sale_active BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS flash_sale_price NUMERIC(12,0);

-- Optionnel : indexer les champs pour les requêtes futures
CREATE INDEX IF NOT EXISTS idx_products_flash_sale_active ON products(flash_sale_active);
