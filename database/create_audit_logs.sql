-- Create audit_logs table for system activity tracking
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT,
    user_name VARCHAR(255),
    user_role VARCHAR(100),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100),
    entity_name VARCHAR(255),
    description TEXT NOT NULL,
    old_values TEXT,
    new_values TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- Add comment to table
COMMENT ON TABLE audit_logs IS 'System audit log for tracking all user activities and changes';

-- Add comments to important columns
COMMENT ON COLUMN audit_logs.action IS 'Action type: LOGIN, LOGOUT, LOGIN_FAILED, CREATE, UPDATE, DELETE, etc.';
COMMENT ON COLUMN audit_logs.entity_type IS 'Entity type: CUSTOMER, DEALER, USER, DOCUMENT, AUTH, etc.';
COMMENT ON COLUMN audit_logs.old_values IS 'JSON string of old values before change';
COMMENT ON COLUMN audit_logs.new_values IS 'JSON string of new values after change';

