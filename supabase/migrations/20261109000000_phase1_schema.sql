-- ==============================================================================
-- PHASE 1: SUPABASE SCHEMA & RLS POLICIES FOR HISHOBH EXPENSE TRACKER
-- Scoped strictly to Clerk user ID via (auth.jwt() ->> 'sub')
-- ==============================================================================

-- 1. ENUMS
DO $$ BEGIN
  CREATE TYPE account_type AS ENUM ('bank', 'cash', 'credit_card', 'savings', 'lend_borrow');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE transaction_type AS ENUM ('income', 'expense', 'transfer', 'lend', 'borrow');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. ACCOUNTS TABLE
CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  type account_type NOT NULL DEFAULT 'bank',
  currency TEXT NOT NULL DEFAULT 'USD',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);

ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

-- Accounts RLS Policies
DROP POLICY IF EXISTS "Users can view their own accounts" ON accounts;
CREATE POLICY "Users can view their own accounts"
  ON accounts FOR SELECT
  USING ((auth.jwt() ->> 'sub') = user_id);

DROP POLICY IF EXISTS "Users can insert their own accounts" ON accounts;
CREATE POLICY "Users can insert their own accounts"
  ON accounts FOR INSERT
  WITH CHECK ((auth.jwt() ->> 'sub') = user_id);

DROP POLICY IF EXISTS "Users can update their own accounts" ON accounts;
CREATE POLICY "Users can update their own accounts"
  ON accounts FOR UPDATE
  USING ((auth.jwt() ->> 'sub') = user_id)
  WITH CHECK ((auth.jwt() ->> 'sub') = user_id);

DROP POLICY IF EXISTS "Users can delete their own accounts" ON accounts;
CREATE POLICY "Users can delete their own accounts"
  ON accounts FOR DELETE
  USING ((auth.jwt() ->> 'sub') = user_id);


-- 3. TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  type transaction_type NOT NULL,
  category TEXT,
  date TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, date DESC);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Transactions RLS Policies
DROP POLICY IF EXISTS "Users can view their own transactions" ON transactions;
CREATE POLICY "Users can view their own transactions"
  ON transactions FOR SELECT
  USING ((auth.jwt() ->> 'sub') = user_id);

DROP POLICY IF EXISTS "Users can insert their own transactions" ON transactions;
CREATE POLICY "Users can insert their own transactions"
  ON transactions FOR INSERT
  WITH CHECK ((auth.jwt() ->> 'sub') = user_id);

DROP POLICY IF EXISTS "Users can update their own transactions" ON transactions;
CREATE POLICY "Users can update their own transactions"
  ON transactions FOR UPDATE
  USING ((auth.jwt() ->> 'sub') = user_id)
  WITH CHECK ((auth.jwt() ->> 'sub') = user_id);

DROP POLICY IF EXISTS "Users can delete their own transactions" ON transactions;
CREATE POLICY "Users can delete their own transactions"
  ON transactions FOR DELETE
  USING ((auth.jwt() ->> 'sub') = user_id);


-- 4. AGGREGATION RPC FUNCTION (Optional high-performance database function)
-- Calculates totals and breakdowns matching the exact design rules:
-- When p_account_id IS NULL (overview), exclude lend_borrow accounts and lend/borrow transactions
CREATE OR REPLACE FUNCTION get_dashboard_summary(
  p_start_date TIMESTAMPTZ,
  p_end_date TIMESTAMPTZ,
  p_account_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id TEXT;
  v_total_income NUMERIC(12, 2) := 0;
  v_total_expense NUMERIC(12, 2) := 0;
  v_result JSONB;
BEGIN
  v_user_id := (auth.jwt() ->> 'sub');
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_account_id IS NULL THEN
    -- GLOBAL OVERVIEW: exclude lend_borrow accounts and lend/borrow transactions
    SELECT 
      COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0),
      COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0)
    INTO v_total_income, v_total_expense
    FROM transactions t
    INNER JOIN accounts a ON a.id = t.account_id
    WHERE t.user_id = v_user_id
      AND a.type != 'lend_borrow'
      AND t.type NOT IN ('lend', 'borrow')
      AND t.date >= p_start_date
      AND t.date <= p_end_date;
  ELSE
    -- SPECIFIC ACCOUNT:
    SELECT 
      COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0),
      COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0)
    INTO v_total_income, v_total_expense
    FROM transactions t
    WHERE t.user_id = v_user_id
      AND t.account_id = p_account_id
      AND t.date >= p_start_date
      AND t.date <= p_end_date;
  END IF;

  v_result := jsonb_build_object(
    'total_income', v_total_income,
    'total_expense', v_total_expense,
    'balance', (v_total_income - v_total_expense)
  );

  RETURN v_result;
END;
$$;
