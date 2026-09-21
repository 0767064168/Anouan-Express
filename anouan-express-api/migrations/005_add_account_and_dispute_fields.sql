-- ============================================================
-- 005 - Champs complémentaires comptes, litiges et versements
-- ============================================================

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS loyalty_points INTEGER NOT NULL DEFAULT 0;

ALTER TABLE disputes
  ADD COLUMN IF NOT EXISTS images TEXT[],
  ADD COLUMN IF NOT EXISTS type VARCHAR(50) NOT NULL DEFAULT 'quality';

ALTER TABLE vendor_payouts
  ADD COLUMN IF NOT EXISTS payout_method VARCHAR(20),
  ADD COLUMN IF NOT EXISTS payout_phone VARCHAR(20);

ALTER TABLE vendor_payouts
  DROP CONSTRAINT IF EXISTS vendor_payouts_payout_method_check;

ALTER TABLE vendor_payouts
  ADD CONSTRAINT vendor_payouts_payout_method_check
  CHECK (payout_method IS NULL OR payout_method IN ('orange', 'mtn', 'wave', 'cash'));

CREATE INDEX IF NOT EXISTS idx_payouts_pending_vendor
  ON vendor_payouts(vendor_id, status)
  WHERE status IN ('pending', 'processing');