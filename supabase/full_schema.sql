-- ==============================================================================
-- HISHOBH FULL DATABASE SCHEMA MIGRATION
-- Run this in the Supabase Dashboard SQL Editor (SQL Editor -> New query -> Run)
-- ==============================================================================

-- 1. ACCOUNTS TABLE
CREATE TABLE IF NOT EXISTS public.accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'bank' CHECK (type IN ('cash', 'bank', 'wallet', 'card')),
  currency TEXT NOT NULL DEFAULT 'INR',
  institution_name TEXT,
  logo_url TEXT,
  color TEXT,
  mask_last4 TEXT,
  initial_balance NUMERIC(12, 2) DEFAULT 0.00,
  opening_balance NUMERIC(12, 2) DEFAULT 0.00,
  opening_balance_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON public.accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_accounts_created_at ON public.accounts(user_id, created_at);

ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own accounts" ON public.accounts;
CREATE POLICY "Users can view their own accounts"
  ON public.accounts FOR SELECT
  USING ((auth.jwt() ->> 'sub') = user_id OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Users can insert their own accounts" ON public.accounts;
CREATE POLICY "Users can insert their own accounts"
  ON public.accounts FOR INSERT
  WITH CHECK ((auth.jwt() ->> 'sub') = user_id OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Users can update their own accounts" ON public.accounts;
CREATE POLICY "Users can update their own accounts"
  ON public.accounts FOR UPDATE
  USING ((auth.jwt() ->> 'sub') = user_id OR auth.role() = 'service_role')
  WITH CHECK ((auth.jwt() ->> 'sub') = user_id OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Users can delete their own accounts" ON public.accounts;
CREATE POLICY "Users can delete their own accounts"
  ON public.accounts FOR DELETE
  USING ((auth.jwt() ->> 'sub') = user_id OR auth.role() = 'service_role');


-- 2. PEOPLE TABLE
CREATE TABLE IF NOT EXISTS public.people (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  relationship TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_people_user_id ON public.people(user_id);
CREATE INDEX IF NOT EXISTS idx_people_name ON public.people(user_id, name);

ALTER TABLE public.people ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own people" ON public.people;
CREATE POLICY "Users can view their own people"
  ON public.people FOR SELECT
  USING ((auth.jwt() ->> 'sub') = user_id OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Users can create their own people" ON public.people;
CREATE POLICY "Users can create their own people"
  ON public.people FOR INSERT
  WITH CHECK ((auth.jwt() ->> 'sub') = user_id OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Users can update their own people" ON public.people;
CREATE POLICY "Users can update their own people"
  ON public.people FOR UPDATE
  USING ((auth.jwt() ->> 'sub') = user_id OR auth.role() = 'service_role')
  WITH CHECK ((auth.jwt() ->> 'sub') = user_id OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Users can delete their own people" ON public.people;
CREATE POLICY "Users can delete their own people"
  ON public.people FOR DELETE
  USING ((auth.jwt() ->> 'sub') = user_id OR auth.role() = 'service_role');


-- 3. TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  person_id UUID REFERENCES public.people(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
  category TEXT,
  date TIMESTAMPTZ NOT NULL DEFAULT now(),
  receipt_url TEXT,
  location_name TEXT,
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7),
  import_batch_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON public.transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_person_id ON public.transactions(person_id);
CREATE INDEX IF NOT EXISTS idx_transactions_import_batch_id ON public.transactions(import_batch_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions(date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON public.transactions(user_id, date DESC);

-- Composite Analytics Performance Indexes
CREATE INDEX IF NOT EXISTS idx_transactions_analytics_timeframe
  ON public.transactions (user_id, date DESC, type);

CREATE INDEX IF NOT EXISTS idx_transactions_analytics_category
  ON public.transactions (user_id, category, type)
  WHERE category IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_transactions_analytics_people
  ON public.transactions (user_id, person_id, type)
  WHERE person_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_transactions_analytics_account
  ON public.transactions (user_id, account_id, type);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own transactions" ON public.transactions;
CREATE POLICY "Users can view their own transactions"
  ON public.transactions FOR SELECT
  USING ((auth.jwt() ->> 'sub') = user_id OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Users can insert their own transactions" ON public.transactions;
CREATE POLICY "Users can insert their own transactions"
  ON public.transactions FOR INSERT
  WITH CHECK ((auth.jwt() ->> 'sub') = user_id OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Users can update their own transactions" ON public.transactions;
CREATE POLICY "Users can update their own transactions"
  ON public.transactions FOR UPDATE
  USING ((auth.jwt() ->> 'sub') = user_id OR auth.role() = 'service_role')
  WITH CHECK ((auth.jwt() ->> 'sub') = user_id OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Users can delete their own transactions" ON public.transactions;
CREATE POLICY "Users can delete their own transactions"
  ON public.transactions FOR DELETE
  USING ((auth.jwt() ->> 'sub') = user_id OR auth.role() = 'service_role');


-- 4. DEBTS TABLE (LEND & BORROW LEDGER)
CREATE TABLE IF NOT EXISTS public.debts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  person_id UUID NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('lend', 'borrow')),
  total_amount NUMERIC(12, 2) NOT NULL CHECK (total_amount > 0),
  settled_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (settled_amount >= 0),
  due_date TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'partially_settled', 'settled')),
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_debts_user_id ON public.debts(user_id);
CREATE INDEX IF NOT EXISTS idx_debts_person_id ON public.debts(person_id);
CREATE INDEX IF NOT EXISTS idx_debts_status ON public.debts(user_id, status);

ALTER TABLE public.debts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own debts" ON public.debts;
CREATE POLICY "Users can view their own debts"
  ON public.debts FOR SELECT
  USING ((auth.jwt() ->> 'sub') = user_id OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Users can create their own debts" ON public.debts;
CREATE POLICY "Users can create their own debts"
  ON public.debts FOR INSERT
  WITH CHECK ((auth.jwt() ->> 'sub') = user_id OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Users can update their own debts" ON public.debts;
CREATE POLICY "Users can update their own debts"
  ON public.debts FOR UPDATE
  USING ((auth.jwt() ->> 'sub') = user_id OR auth.role() = 'service_role')
  WITH CHECK ((auth.jwt() ->> 'sub') = user_id OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Users can delete their own debts" ON public.debts;
CREATE POLICY "Users can delete their own debts"
  ON public.debts FOR DELETE
  USING ((auth.jwt() ->> 'sub') = user_id OR auth.role() = 'service_role');


-- 5. DEBT_SETTLEMENTS TABLE (REPAYMENTS)
CREATE TABLE IF NOT EXISTS public.debt_settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  debt_id UUID NOT NULL REFERENCES public.debts(id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  settlement_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_debt_settlements_debt_id ON public.debt_settlements(debt_id);

ALTER TABLE public.debt_settlements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view settlements for their debts" ON public.debt_settlements;
CREATE POLICY "Users can view settlements for their debts"
  ON public.debt_settlements FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.debts
      WHERE debts.id = debt_settlements.debt_id
        AND (debts.user_id = (auth.jwt() ->> 'sub') OR auth.role() = 'service_role')
    )
  );

DROP POLICY IF EXISTS "Users can insert settlements for their debts" ON public.debt_settlements;
CREATE POLICY "Users can insert settlements for their debts"
  ON public.debt_settlements FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.debts
      WHERE debts.id = debt_settlements.debt_id
        AND (debts.user_id = (auth.jwt() ->> 'sub') OR auth.role() = 'service_role')
    )
  );

DROP POLICY IF EXISTS "Users can delete settlements for their debts" ON public.debt_settlements;
CREATE POLICY "Users can delete settlements for their debts"
  ON public.debt_settlements FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.debts
      WHERE debts.id = debt_settlements.debt_id
        AND (debts.user_id = (auth.jwt() ->> 'sub') OR auth.role() = 'service_role')
    )
  );

-- Auto-update settled_amount and status on new settlement
CREATE OR REPLACE FUNCTION public.handle_debt_settlement_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total NUMERIC(12, 2);
  v_settled NUMERIC(12, 2);
  v_target_debt_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_target_debt_id := OLD.debt_id;
  ELSE
    v_target_debt_id := NEW.debt_id;
  END IF;

  SELECT COALESCE(SUM(amount), 0)
  INTO v_settled
  FROM public.debt_settlements
  WHERE debt_id = v_target_debt_id;

  SELECT total_amount
  INTO v_total
  FROM public.debts
  WHERE id = v_target_debt_id;

  UPDATE public.debts
  SET 
    settled_amount = v_settled,
    status = CASE 
      WHEN v_settled >= v_total THEN 'settled'
      WHEN v_settled > 0 THEN 'partially_settled'
      ELSE 'pending'
    END
  WHERE id = v_target_debt_id;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_debt_settlement_update ON public.debt_settlements;
CREATE TRIGGER trg_debt_settlement_update
  AFTER INSERT OR UPDATE OR DELETE ON public.debt_settlements
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_debt_settlement_update();

