-- Migration: Add import_batch_id to transactions for rollback support
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS import_batch_id UUID;

CREATE INDEX IF NOT EXISTS idx_transactions_import_batch_id ON transactions(import_batch_id);

