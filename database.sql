-- Bảng lưu trữ liên kết của user
CREATE TABLE user_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  display_name text NOT NULL,
  website text NOT NULL,
  store_code text,
  username text NOT NULL,
  password_encrypted text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS for user_connections
ALTER TABLE user_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own connections"
ON user_connections FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
