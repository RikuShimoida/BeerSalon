-- テストユーザーを auth.users に作成
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_token,
  raw_app_meta_data,
  raw_user_meta_data
)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  '11111111-1111-1111-1111-111111111111',
  'authenticated',
  'authenticated',
  'test@example.com',
  crypt('password123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '',
  '{"provider": "email", "providers": ["email"]}',
  '{}'
);

-- テストユーザーのプロフィールを作成
INSERT INTO user_profiles (
  id,
  user_auth_id,
  last_name,
  first_name,
  nickname,
  birthday,
  gender,
  prefecture,
  is_active,
  created_at,
  updated_at
)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  '11111111-1111-1111-1111-111111111111',
  'テスト',
  'ユーザー',
  'testuser',
  '1990-01-01',
  'male',
  '東京都',
  true,
  NOW(),
  NOW()
);
