-- ============================================================
-- ANOUAN EXPRESS — Migrations PostgreSQL
-- Fichier unique : exécuter dans l'ordre avec psql ou un runner
-- ============================================================

-- Extension pour UUID
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 001 — UTILISATEURS
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         VARCHAR(150) NOT NULL,
  phone        VARCHAR(20) UNIQUE,
  email        VARCHAR(255) UNIQUE,
  password_hash TEXT,
  role         VARCHAR(20) NOT NULL DEFAULT 'client'
                 CHECK (role IN ('client','vendor','admin','agent')),
  status       VARCHAR(20) NOT NULL DEFAULT 'active'
                 CHECK (status IN ('active','inactive','banned')),
  avatar_url   TEXT,
  fcm_token    TEXT,          -- Token Firebase pour notifications push
  otp_code     VARCHAR(10),
  otp_expires_at TIMESTAMPTZ,
  reset_token  VARCHAR(255),
  reset_token_expires_at TIMESTAMPTZ,
  refresh_token TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email  ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone  ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_role   ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users(reset_token);

-- ============================================================
-- 002 — VENDEURS
-- ============================================================
CREATE TABLE IF NOT EXISTS vendors (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  shop_name         VARCHAR(150) NOT NULL,
  description       TEXT,
  logo_url          TEXT,
  legal_doc_url     TEXT,         -- Pièce d'identité / registre de commerce
  validation_status VARCHAR(20) NOT NULL DEFAULT 'pending'
                      CHECK (validation_status IN ('pending','approved','rejected','suspended')),
  rejection_reason  TEXT,
  commission_rate   NUMERIC(5,2) NOT NULL DEFAULT 10.00, -- % prélevé par la plateforme
  avg_rating        NUMERIC(3,2) DEFAULT 0,
  total_sales       INTEGER DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_vendors_user ON vendors(user_id);

-- ============================================================
-- 003 — CATÉGORIES
-- ============================================================
CREATE TABLE IF NOT EXISTS categories (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name      VARCHAR(100) NOT NULL,
  slug      VARCHAR(120) NOT NULL UNIQUE,
  icon      TEXT,
  image_url TEXT,
  parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_slug   ON categories(slug);

-- ============================================================
-- 004 — PRODUITS
-- ============================================================
CREATE TABLE IF NOT EXISTS products (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id    UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  category_id  UUID REFERENCES categories(id) ON DELETE SET NULL,
  title        VARCHAR(255) NOT NULL,
  description  TEXT,
  price        NUMERIC(12,0) NOT NULL CHECK (price >= 0), -- XOF, pas de décimales
  stock        INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  sku          VARCHAR(100),
  status       VARCHAR(20) NOT NULL DEFAULT 'active'
                 CHECK (status IN ('active','inactive','out_of_stock','deleted')),
  flash_sale_active BOOLEAN NOT NULL DEFAULT FALSE,
  flash_sale_price  NUMERIC(12,0),
  avg_rating   NUMERIC(3,2) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  sold_count   INTEGER DEFAULT 0,
  is_featured  BOOLEAN DEFAULT FALSE,
  weight_grams INTEGER,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_vendor   ON products(vendor_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_status   ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_title    ON products USING GIN(to_tsvector('french', title));

CREATE TABLE IF NOT EXISTS product_variants (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name        VARCHAR(100) NOT NULL, -- ex: "Taille L", "Couleur Rouge"
  value       VARCHAR(100) NOT NULL,
  price_delta NUMERIC(12,0) DEFAULT 0, -- surcoût ou remise vs prix de base
  stock       INTEGER NOT NULL DEFAULT 0,
  sku         VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS idx_variants_product ON product_variants(product_id);

CREATE TABLE IF NOT EXISTS product_images (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image_url  TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  position   INTEGER DEFAULT 0,
  alt_text   VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_images_product ON product_images(product_id);

-- ============================================================
-- 005 — MAGASINS CENTRAUX
-- ============================================================
CREATE TABLE IF NOT EXISTS stores (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       VARCHAR(150) NOT NULL,
  address    TEXT NOT NULL,
  city       VARCHAR(100) NOT NULL,
  phone      VARCHAR(20),
  gps_lat    NUMERIC(10,7),
  gps_lng    NUMERIC(10,7),
  is_active  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 006 — COMMANDES
-- ============================================================
CREATE TABLE IF NOT EXISTS orders (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id      UUID NOT NULL REFERENCES users(id),
  store_id       UUID REFERENCES stores(id),
  status         VARCHAR(30) NOT NULL DEFAULT 'created'
                   CHECK (status IN (
                     'created','preparing','shipped_to_store',
                     'received_at_store','ready_for_pickup',
                     'picked_up','cancelled','disputed'
                   )),
  payment_method VARCHAR(30) NOT NULL DEFAULT 'pickup'
                   CHECK (payment_method IN ('orange_money','mtn_momo','wave','pickup')),
  payment_status VARCHAR(20) NOT NULL DEFAULT 'pending'
                   CHECK (payment_status IN ('pending','paid','failed','refunded')),
  total_amount   NUMERIC(14,0) NOT NULL DEFAULT 0,
  notes          TEXT,
  cancelled_at   TIMESTAMPTZ,
  cancel_reason  TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_client ON orders(client_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_store  ON orders(store_id);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);

CREATE TABLE IF NOT EXISTS order_items (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id     UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id   UUID REFERENCES products(id) ON DELETE SET NULL,
  vendor_id    UUID NOT NULL REFERENCES vendors(id),
  variant_id   UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  title        VARCHAR(255) NOT NULL,  -- Snapshot du titre
  unit_price   NUMERIC(12,0) NOT NULL,
  quantity     INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  status       VARCHAR(30) NOT NULL DEFAULT 'preparing'
                 CHECK (status IN (
                   'preparing','shipped_to_store','received_at_store','picked_up'
                 )),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order  ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_vendor ON order_items(vendor_id);

-- ============================================================
-- 007 — PAIEMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS payments (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id         UUID NOT NULL REFERENCES orders(id),
  provider         VARCHAR(30) NOT NULL, -- cinetpay, paydunya, pickup
  amount           NUMERIC(14,0) NOT NULL,
  currency         VARCHAR(5) NOT NULL DEFAULT 'XOF',
  status           VARCHAR(20) NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending','success','failed','refunded')),
  reference        VARCHAR(255),        -- Référence côté agrégateur
  provider_data    JSONB,               -- Payload brut du webhook
  initiated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  confirmed_at     TIMESTAMPTZ,
  refunded_at      TIMESTAMPTZ,
  refund_amount    NUMERIC(14,0)
);

CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_ref   ON payments(reference);

-- ============================================================
-- 008 — RÉCEPTION MAGASIN & CODE DE RETRAIT
-- ============================================================
CREATE TABLE IF NOT EXISTS store_receptions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_item_id    UUID NOT NULL REFERENCES order_items(id),
  store_id         UUID NOT NULL REFERENCES stores(id),
  agent_id         UUID NOT NULL REFERENCES users(id),
  received_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  condition        VARCHAR(20) NOT NULL DEFAULT 'good'
                     CHECK (condition IN ('good','damaged','incomplete')),
  condition_notes  TEXT,
  storage_location VARCHAR(100),  -- ex: "Étagère A3"
  bordereau_ref    VARCHAR(100)   -- Référence du bordereau apporté par le vendeur
);

CREATE INDEX IF NOT EXISTS idx_receptions_item  ON store_receptions(order_item_id);
CREATE INDEX IF NOT EXISTS idx_receptions_store ON store_receptions(store_id);

CREATE TABLE IF NOT EXISTS pickup_codes (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id     UUID NOT NULL UNIQUE REFERENCES orders(id),
  code         VARCHAR(20) NOT NULL UNIQUE,
  qr_data      TEXT NOT NULL,
  status       VARCHAR(20) NOT NULL DEFAULT 'active'
                 CHECK (status IN ('active','used','expired','blocked')),
  expires_at   TIMESTAMPTZ NOT NULL,
  used_at      TIMESTAMPTZ,
  agent_id     UUID REFERENCES users(id),   -- Agent qui a fait le retrait
  attempt_count INTEGER NOT NULL DEFAULT 0,
  delegate_name     VARCHAR(150),            -- Tiers autorisé
  delegate_id_ref   VARCHAR(100),           -- Réf. pièce d'identité du tiers
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pickup_codes_code  ON pickup_codes(code);
CREATE INDEX IF NOT EXISTS idx_pickup_codes_order ON pickup_codes(order_id);

CREATE TABLE IF NOT EXISTS pickup_code_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pickup_code_id  UUID NOT NULL REFERENCES pickup_codes(id),
  agent_id        UUID REFERENCES users(id),
  attempted_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  success         BOOLEAN NOT NULL DEFAULT FALSE,
  ip_address      INET,
  notes           TEXT
);

-- ============================================================
-- 009 — AVIS & NOTES
-- ============================================================
CREATE TABLE IF NOT EXISTS reviews (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  vendor_id  UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  client_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_id   UUID REFERENCES orders(id),
  rating     SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment    TEXT,
  images     TEXT[],             -- URLs des photos
  is_visible BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_unique ON reviews(product_id, client_id, order_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_vendor  ON reviews(vendor_id);

-- ============================================================
-- 010 — MESSAGERIE
-- ============================================================
CREATE TABLE IF NOT EXISTS messages (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id    UUID NOT NULL REFERENCES users(id),
  recipient_id UUID NOT NULL REFERENCES users(id),
  product_id   UUID REFERENCES products(id) ON DELETE SET NULL,
  order_id     UUID REFERENCES orders(id) ON DELETE SET NULL,
  content      TEXT NOT NULL,
  is_read      BOOLEAN DEFAULT FALSE,
  read_at      TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_sender    ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_order     ON messages(order_id);

-- ============================================================
-- 011 — LITIGES
-- ============================================================
CREATE TABLE IF NOT EXISTS disputes (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id       UUID NOT NULL REFERENCES orders(id),
  opened_by      UUID NOT NULL REFERENCES users(id),
  reason         TEXT NOT NULL,
  status         VARCHAR(20) NOT NULL DEFAULT 'open'
                   CHECK (status IN ('open','investigating','resolved','closed')),
  resolution     TEXT,
  refund_amount  NUMERIC(14,0),
  resolved_by    UUID REFERENCES users(id),
  resolved_at    TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_disputes_order  ON disputes(order_id);
CREATE INDEX IF NOT EXISTS idx_disputes_status ON disputes(status);

-- ============================================================
-- 012 — NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type       VARCHAR(50) NOT NULL,  -- order_created, pickup_ready, etc.
  title      VARCHAR(255) NOT NULL,
  body       TEXT,
  is_read    BOOLEAN DEFAULT FALSE,
  read_at    TIMESTAMPTZ,
  metadata   JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notif_user   ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notif_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;

-- ============================================================
-- 013 — DIVERS (wishlist, flash sales, bannières, audit, versements)
-- ============================================================

-- Liste de souhaits
CREATE TABLE IF NOT EXISTS wishlist_items (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- Ventes flash
CREATE TABLE IF NOT EXISTS flash_sales (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id       UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  discount_percent NUMERIC(5,2) NOT NULL CHECK (discount_percent BETWEEN 1 AND 100),
  flash_price      NUMERIC(12,0) NOT NULL,
  starts_at        TIMESTAMPTZ NOT NULL,
  ends_at          TIMESTAMPTZ NOT NULL,
  is_active        BOOLEAN DEFAULT TRUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_flash_active ON flash_sales(is_active, ends_at);

-- Bannières homepage
CREATE TABLE IF NOT EXISTS banners (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title      VARCHAR(255),
  image_url  TEXT NOT NULL,
  link_url   TEXT,
  position   INTEGER DEFAULT 0,
  is_active  BOOLEAN DEFAULT TRUE,
  starts_at  TIMESTAMPTZ,
  ends_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Journal d'audit des actions sensibles
CREATE TABLE IF NOT EXISTS audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  action      VARCHAR(100) NOT NULL,  -- vendor.validate, pickup.use, refund.issue…
  entity_type VARCHAR(50),
  entity_id   UUID,
  metadata    JSONB DEFAULT '{}',
  ip_address  INET,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_user   ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(entity_type, entity_id);

-- Versements aux vendeurs
CREATE TABLE IF NOT EXISTS vendor_payouts (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id      UUID NOT NULL REFERENCES vendors(id),
  period_start   DATE NOT NULL,
  period_end     DATE NOT NULL,
  amount_due     NUMERIC(14,0) NOT NULL DEFAULT 0,
  amount_paid    NUMERIC(14,0) NOT NULL DEFAULT 0,
  status         VARCHAR(20) NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending','processing','paid','failed')),
  paid_at        TIMESTAMPTZ,
  payment_ref    VARCHAR(255),
  notes          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payouts_vendor ON vendor_payouts(vendor_id);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON vendor_payouts(status);

-- Configuration de la plateforme (clé-valeur)
CREATE TABLE IF NOT EXISTS platform_settings (
  key         VARCHAR(100) PRIMARY KEY,
  value       TEXT,
  description TEXT,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Fonction de mise à jour automatique de updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers updated_at sur les tables principales
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['users','vendors','products','stores','orders',
                              'order_items','disputes','vendor_payouts','platform_settings'] LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS trg_%s_updated_at ON %s;
       CREATE TRIGGER trg_%s_updated_at
       BEFORE UPDATE ON %s
       FOR EACH ROW EXECUTE FUNCTION update_updated_at();',
      tbl, tbl, tbl, tbl
    );
  END LOOP;
END;
$$;
