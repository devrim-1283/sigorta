-- Create SMS Logs table for tracking all SMS communications
CREATE TABLE IF NOT EXISTS sms_logs (
    id BIGSERIAL PRIMARY KEY,
    recipient_name VARCHAR(255),
    recipient_phone VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    sender_name VARCHAR(100) DEFAULT 'SEFFAF DAN',
    job_id VARCHAR(100),
    status VARCHAR(50) DEFAULT 'pending',
    delivery_status VARCHAR(50),
    error_message TEXT,
    customer_id BIGINT REFERENCES customers(id) ON DELETE SET NULL,
    sent_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    sent_at TIMESTAMP DEFAULT NOW(),
    delivered_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_sms_logs_customer_id ON sms_logs(customer_id);
CREATE INDEX IF NOT EXISTS idx_sms_logs_sent_by ON sms_logs(sent_by);
CREATE INDEX IF NOT EXISTS idx_sms_logs_status ON sms_logs(status);
CREATE INDEX IF NOT EXISTS idx_sms_logs_sent_at ON sms_logs(sent_at);
CREATE INDEX IF NOT EXISTS idx_sms_logs_job_id ON sms_logs(job_id);

-- Add comments
COMMENT ON TABLE sms_logs IS 'Logs all SMS communications sent through the system';
COMMENT ON COLUMN sms_logs.status IS 'Status values: pending, sent, delivered, failed';
COMMENT ON COLUMN sms_logs.delivery_status IS 'NetGSM delivery status from report API';
COMMENT ON COLUMN sms_logs.job_id IS 'NetGSM job ID for tracking delivery status';

