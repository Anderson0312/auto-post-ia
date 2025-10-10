-- Post logs table to track publishing outcomes and failures
CREATE TABLE IF NOT EXISTS post_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID REFERENCES posts(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    social_account_id UUID REFERENCES social_accounts(id) ON DELETE SET NULL,
    platform VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL, -- success, error, info
    message TEXT,
    error_code VARCHAR(100),
    external_post_id VARCHAR(255), -- ID returned by the platform
    context JSONB, -- arbitrary data for debugging
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for faster querying
CREATE INDEX IF NOT EXISTS idx_post_logs_user_id ON post_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_post_logs_post_id ON post_logs(post_id);
CREATE INDEX IF NOT EXISTS idx_post_logs_created_at ON post_logs(created_at);