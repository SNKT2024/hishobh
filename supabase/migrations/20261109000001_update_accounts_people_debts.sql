-- ==============================================================================
-- PHASE 2: ARCHITECTURE UPGRADE
-- 1. Strict Account Types ('cash', 'bank', 'wallet', 'card') with brand/logo support
-- 2. Centralized 'people' Table (counterparties and transaction tags)
-- 3. Isolated 'debts' (Lend & Borrow) and 'debt_settlements' Ledger
-- ==============================================================================

-- 1. UPGRADE ACCOUNTS TABLE
-- Migrate existing data if needed before modifying constraints
DO $$ BEGIN
  -- If accounts table has old enum, migrate values
  UPDATE accounts SET type = 'card' WHERE type::text IN ('credit_card');
  UPDATE accounts SET type = 'bank' WHERE type::text IN ('savings');
  DELETE FROM accounts WHERE type::text = 'lend_borrow';
EXCEPTION
  WHEN undefined_table THEN null;
  WHEN undefined_column THEN null;
END $$;

-- Drop old check/type constraints on accounts
ALTER TABLE accounts ALTER COLUMN type TYPE TEXT;
DROP TYPE IF EXISTS account_type CASCADE;

-- Enforce new strict account types and add brand/logo fields
ALTER TABLE accounts
  ADD CONSTRAINT accounts_type_check CHECK (type IN ('cash', 'bank', 'wallet', 'card')),
  ADD COLUMN IF NOT EXISTS institution_name TEXT,
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS color TEXT;


-- 2. CREATE PEOPLE TABLE
CREATE TABLE IF NOT EXISTS people (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  relationship TEXT, -- 'Friend', 'Family', 'Colleague', 'Partner', 'Work', 'Other'
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_people_user_id ON people(user_id);
CREATE INDEX IF NOT EXISTS idx_people_name ON people(user_id, name);

ALTER TABLE people ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own people" ON people;
CREATE POLICY "Users can view their own people"
  ON people FOR SELECT
  USING ((auth.jwt() ->> 'sub') = user_id);

DROP POLICY IF EXISTS "Users can create their own people" ON people;
CREATE POLICY "Users can create their own people"
  ON people FOR INSERT
  WITH CHECK ((auth.jwt() ->> 'sub') = user_id);

DROP POLICY IF EXISTS "Users can update their own people" ON people;
CREATE POLICY "Users can update their own people"
  ON people FOR UPDATE
  USING ((auth.jwt() ->> 'sub') = user_id)
  WITH CHECK ((auth.jwt() ->> 'sub') = user_id);

DROP POLICY IF EXISTS "Users can delete their own people" ON people;
CREATE POLICY "Users can delete their own people"
  ON people FOR DELETE
  USING ((auth.jwt() ->> 'sub') = user_id);


-- 3. UPDATE TRANSACTIONS TABLE
-- Add person_id foreign key
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS person_id UUID REFERENCES people(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_transactions_person_id ON transactions(person_id);

-- Enforce transaction types strictly to income, expense, transfer (Lend/Borrow isolated to debts table)
ALTER TABLE transactions ALTER COLUMN type TYPE TEXT;
DROP TYPE IF EXISTS transaction_type CASCADE;

-- Clean up any existing lend/borrow transactions from transactions table
DELETE FROM transactions WHERE type IN ('lend', 'borrow');

ALTER TABLE transactions
  ADD CONSTRAINT transactions_type_check CHECK (type IN ('income', 'expense', 'transfer'));


-- 4. CREATE DEBTS TABLE (LEND & BORROW LEDGER)
CREATE TABLE IF NOT EXISTS debts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('lend', 'borrow')),
  total_amount NUMERIC(12, 2) NOT NULL CHECK (total_amount > 0),
  settled_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (settled_amount >= 0),
  due_date TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'partially_settled', 'settled')),
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_debts_user_id ON debts(user_id);
CREATE INDEX IF NOT EXISTS idx_debts_person_id ON debts(person_id);
CREATE INDEX IF NOT EXISTS idx_debts_status ON debts(user_id, status);

ALTER TABLE debts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own debts" ON debts;
CREATE POLICY "Users can view their own debts"
  ON debts FOR SELECT
  USING ((auth.jwt() ->> 'sub') = user_id);

DROP POLICY IF EXISTS "Users can create their own debts" ON debts;
CREATE POLICY "Users can create their own debts"
  ON debts FOR INSERT
  WITH CHECK ((auth.jwt() ->> 'sub') = user_id);

DROP POLICY IF EXISTS "Users can update their own debts" ON debts;
CREATE POLICY "Users can update their own debts"
  ON debts FOR UPDATE
  USING ((auth.jwt() ->> 'sub') = user_id)
  WITH CHECK ((auth.jwt() ->> 'sub') = user_id);

DROP POLICY IF EXISTS "Users can delete their own debts" ON debts;
CREATE POLICY "Users can delete their own debts"
  ON debts FOR DELETE
  USING ((auth.jwt() ->> 'sub') = user_id);


-- 5. CREATE DEBT_SETTLEMENTS TABLE (REPAYMENTS)
CREATE TABLE IF NOT EXISTS debt_settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  debt_id UUID NOT NULL REFERENCES debts(id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  settlement_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_debt_settlements_debt_id ON debt_settlements(debt_id);

ALTER TABLE debt_settlements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view settlements for their debts" ON debt_settlements;
CREATE POLICY "Users can view settlements for their debts"
  ON debt_settlements FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM debts
      WHERE debts.id = debt_settlements.debt_id
        AND debts.user_id = (auth.jwt() ->> 'sub')
    )
  );

DROP POLICY IF EXISTS "Users can insert settlements for their debts" ON debt_settlements;
CREATE POLICY "Users can insert settlements for their debts"
  ON debt_settlements FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM debts
      WHERE debts.id = debt_settlements.debt_id
        AND debts.user_id = (auth.jwt() ->> 'sub')
    )
  );

DROP POLICY IF EXISTS "Users can delete settlements for their debts" ON debt_settlements;
CREATE POLICY "Users can delete settlements for their debts"
  ON debt_settlements FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM debts
      WHERE debts.id = debt_settlements.debt_id
        AND debts.user_id = (auth.jwt() ->> 'sub')
    )
  );


-- Trigger to automatically update debts.settled_amount and status on new settlement
CREATE OR REPLACE FUNCTION handle_debt_settlement_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total NUMERIC(12, 2);
  v_settled NUMERIC(12, 2);
BEGIN
  -- Sum all settlements for this debt
  SELECT COALESCE(SUM(amount), 0)
  INTO v_settled
  FROM debt_settlements
  WHERE debt_id = NEW.debt_id;

  SELECT total_amount
  INTO v_total
  FROM debts
  WHERE id = NEW.debt_id;

  -- Update settled amount and status
  UPDATE debts
  SET 
    settled_amount = v_settled,
    status = CASE 
      WHEN v_settled >= v_total THEN 'settled'
      WHEN v_settled > 0 THEN 'partially_settled'
      ELSE 'pending'
    END
  WHERE id = NEW.debt_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_debt_settlement_update ON debt_settlements;
CREATE TRIGGER trg_debt_settlement_update
  AFTER INSERT OR UPDATE OR DELETE ON debt_settlements
  FOR EACH ROW
  EXECUTE FUNCTION handle_debt_settlement_update();
