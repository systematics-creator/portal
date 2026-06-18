-- 1. Table apps
CREATE TABLE apps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  website text NOT NULL,
  app_code text NOT NULL UNIQUE
);

-- 2. Table user_connections
CREATE TABLE user_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  app_id uuid NOT NULL REFERENCES apps(id),
  store_code text,
  username text NOT NULL,
  display_name text,
  is_active boolean DEFAULT true,
  connection_version integer DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS for user_connections
ALTER TABLE user_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own connections"
ON user_connections FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own connections"
ON user_connections FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own connections"
ON user_connections FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own connections"
ON user_connections FOR DELETE
TO authenticated
USING (auth.uid() = user_id);


-- 3. Table connection_logs
CREATE TABLE connection_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  connection_id uuid NOT NULL,
  app_id uuid NOT NULL,
  status text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS for connection_logs
ALTER TABLE connection_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own logs"
ON connection_logs FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own logs"
ON connection_logs FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Note: used_tokens table is deliberately omitted here.
alter table apps enable row level security;
create policy "Cho phép ai đã đăng nhập được xem danh sách app" on apps for select to authenticated using (true);
create policy "Cho phép ai đã đăng nhập được thêm app mới" on apps for insert to authenticated with check (true);
-- It should be created in the local database of each child app (PosSpa, LogoAI, CRM).
/*
-- Local App DB table for used_tokens
CREATE TABLE used_tokens (
  jti text PRIMARY KEY,
  app_code text,
  created_at timestamptz DEFAULT now()
);
*/
