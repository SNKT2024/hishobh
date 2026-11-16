-- ==============================================================================
-- PHASE 6: STATS & ANALYTICS ENGINE INDEXES & OPTIMIZATIONS
-- Provides blazing fast aggregation on transactions table
-- Isolation Rule: Strictly transactions (income/expense), excluding debts
-- ==============================================================================

-- 1. Composite index for timeframe filtering and income/expense breakdown
CREATE INDEX IF NOT EXISTS idx_transactions_analytics_timeframe
  ON transactions (user_id, date DESC, type);

-- 2. Composite index for category spending breakdowns
CREATE INDEX IF NOT EXISTS idx_transactions_analytics_category
  ON transactions (user_id, category, type)
  WHERE category IS NOT NULL;

-- 3. Composite index for "Spent with People" social spending
CREATE INDEX IF NOT EXISTS idx_transactions_analytics_people
  ON transactions (user_id, person_id, type)
  WHERE person_id IS NOT NULL;

-- 4. Composite index for Account payment distribution
CREATE INDEX IF NOT EXISTS idx_transactions_analytics_account
  ON transactions (user_id, account_id, type);

