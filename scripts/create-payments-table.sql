-- Create payments table to track all employee payments
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  amount DECIMAL(18, 6) NOT NULL,
  currency VARCHAR(10) DEFAULT 'USDC',
  status VARCHAR(20) DEFAULT 'pending',
  tx_hash TEXT,
  block_number BIGINT,
  gas_used BIGINT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_payments_employee_id ON payments(employee_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_tx_hash ON payments(tx_hash);

-- Enable Row Level Security
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for service role
CREATE POLICY "Allow all for service role" ON payments
  FOR ALL
  USING (true)
  WITH CHECK (true);

COMMENT ON TABLE payments IS 'Stores payment transaction records for employees';
COMMENT ON COLUMN payments.employee_id IS 'Reference to the employee who received the payment';
COMMENT ON COLUMN payments.amount IS 'Payment amount in the specified currency';
COMMENT ON COLUMN payments.currency IS 'Currency of the payment (default: USDC)';
COMMENT ON COLUMN payments.status IS 'Payment status: pending, confirmed, failed';
COMMENT ON COLUMN payments.tx_hash IS 'Blockchain transaction hash';
COMMENT ON COLUMN payments.block_number IS 'Block number where transaction was confirmed';
COMMENT ON COLUMN payments.gas_used IS 'Gas used for the transaction';
