-- ============================================================
-- ANOUAN EXPRESS — Seeds de démarrage
-- Données initiales : admin, catégories, magasin de Bouaké
-- ============================================================

-- ============================================================
-- Catégories principales
-- ============================================================
INSERT INTO categories (name, slug, icon, sort_order) VALUES
  ('Électronique',        'electronique',        '📱', 1),
  ('Mode & Vêtements',    'mode-vetements',       '👗', 2),
  ('Maison & Cuisine',    'maison-cuisine',       '🏠', 3),
  ('Beauté & Santé',      'beaute-sante',         '💄', 4),
  ('Alimentation',        'alimentation',         '🛒', 5),
  ('Sport & Loisirs',     'sport-loisirs',        '⚽', 6),
  ('Informatique',        'informatique',         '💻', 7),
  ('Bébé & Enfant',       'bebe-enfant',          '🍼', 8),
  ('Téléphonie',          'telephonie',           '📞', 9),
  ('Automobile',          'automobile',           '🚗', 10)
ON CONFLICT (slug) DO NOTHING;

-- Sous-catégories Électronique
WITH parent AS (SELECT id FROM categories WHERE slug = 'electronique' LIMIT 1)
INSERT INTO categories (name, slug, parent_id, sort_order)
SELECT name, slug, parent.id, sort_order
FROM parent, (VALUES
  ('Téléviseurs',        'electronique-tv',        1),
  ('Audio & Son',        'electronique-audio',      2),
  ('Appareils photo',    'electronique-photo',      3),
  ('Climatisation',      'electronique-clim',       4)
) AS sub(name, slug, sort_order)
ON CONFLICT (slug) DO NOTHING;

-- Sous-catégories Mode
WITH parent AS (SELECT id FROM categories WHERE slug = 'mode-vetements' LIMIT 1)
INSERT INTO categories (name, slug, parent_id, sort_order)
SELECT name, slug, parent.id, sort_order
FROM parent, (VALUES
  ('Vêtements Homme',    'mode-homme',     1),
  ('Vêtements Femme',    'mode-femme',     2),
  ('Chaussures',         'mode-chaussures',3),
  ('Accessoires',        'mode-accessoires',4)
) AS sub(name, slug, sort_order)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- Magasin central de Bouaké (unique au lancement)
-- ============================================================
INSERT INTO stores (name, address, city, phone, gps_lat, gps_lng, is_active)
VALUES (
  'Magasin Central Anouan Express — Bouaké',
  'Centre commercial, Quartier Commerce, Bouaké',
  'Bouaké',
  '+22500000001',
  7.6906,
  -5.0304,
  TRUE
) ON CONFLICT DO NOTHING;

-- ============================================================
-- Paramètres de la plateforme
-- ============================================================
INSERT INTO platform_settings (key, value, description) VALUES
  ('commission_default_rate',    '10',    'Taux de commission par défaut (%)'),
  ('pickup_code_validity_days',  '15',    'Durée de validité du code de retrait (jours)'),
  ('pickup_code_max_attempts',   '5',     'Nombre max de tentatives avant blocage du code'),
  ('pickup_reminder_days',       '3',     'Jours avant rappel si commande non retirée'),
  ('allow_partial_pickup',       'false', 'Autoriser le retrait partiel (phase 2)'),
  ('maintenance_mode',           'false', 'Mode maintenance (true = site hors ligne)'),
  ('payment_pickup_enabled',     'true',  'Autoriser le paiement au retrait'),
  ('flash_sale_featured_count',  '6',     'Nombre de produits affichés en vente flash sur la home')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
