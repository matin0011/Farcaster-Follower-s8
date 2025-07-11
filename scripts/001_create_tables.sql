CREATE TABLE IF NOT EXISTS users (
    fid BIGINT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    display_name VARCHAR(255) NOT NULL,
    pfp_url TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_stats (
    fid BIGINT PRIMARY KEY REFERENCES users(fid) ON DELETE CASCADE,
    coins INT DEFAULT 0,
    follows_given INT DEFAULT 0,
    followers_received INT DEFAULT 0,
    referrals INT DEFAULT 0,
    last_updated TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS follow_orders (
    id SERIAL PRIMARY KEY,
    requester_fid BIGINT NOT NULL REFERENCES users(fid) ON DELETE CASCADE,
    target_fid BIGINT NOT NULL, -- This FID might not be in our 'users' table yet if they haven't used the app
    username VARCHAR(255) NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    pfp_url TEXT,
    quantity INT NOT NULL,
    cost INT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- e.g., 'pending', 'completed', 'cancelled'
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS follow_actions (
    id SERIAL PRIMARY KEY,
    follower_fid BIGINT NOT NULL REFERENCES users(fid) ON DELETE CASCADE,
    target_fid BIGINT NOT NULL,
    coins_earned INT DEFAULT 0,
    action_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(follower_fid, target_fid) -- Ensure a user can only follow a target once in our system
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_follow_orders_requester_fid ON follow_orders(requester_fid);
CREATE INDEX IF NOT EXISTS idx_follow_orders_target_fid ON follow_orders(target_fid);
CREATE INDEX IF NOT EXISTS idx_follow_actions_follower_target ON follow_actions(follower_fid, target_fid);
