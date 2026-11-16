-- Migration: Historical Backfilling & Account Balance Reconciliation
-- 1. Add opening_balance and opening_balance_date to accounts table
ALTER TABLE accounts 
ADD COLUMN IF NOT EXISTS opening_balance NUMERIC(12, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS opening_balance_date TIMESTAMPTZ DEFAULT now();

-- 2. Populate opening_balance and opening_balance_date from existing initial_balance and created_at
UPDATE accounts
SET 
  opening_balance = COALESCE(opening_balance, initial_balance, 0.00),
  opening_balance_date = COALESCE(opening_balance_date, created_at, now())
WHERE opening_balance IS NULL OR opening_balance_date IS NULL;

-- 3. Add indexes on transactions for ultra-fast historical balance calculation & sorting
CREATE INDEX IF NOT EXISTS idx_transactions_account_date ON transactions(account_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, date DESC);

