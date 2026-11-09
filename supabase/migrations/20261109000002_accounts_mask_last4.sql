-- ==============================================================================
-- ACCOUNTS ENHANCEMENT: Masked last 4 digits & starting balance
-- ==============================================================================

ALTER TABLE accounts
  ADD COLUMN IF NOT EXISTS mask_last4 TEXT,
  ADD COLUMN IF NOT EXISTS initial_balance NUMERIC(12, 2) DEFAULT 0.00;
