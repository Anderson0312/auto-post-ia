-- Update demo user password to a known value for demo access
-- Password: demo123456 (hashed with bcrypt)

UPDATE users 
SET password = '$2a$12$LQv3c1yqBwEHXLAw98FBu.BTdGnOm2f.YrjvQQb3QXk9QXk9QXk9QX'
WHERE email = 'demo@autopostia.com';

-- Ensure demo user has all necessary data
UPDATE users 
SET 
  name = 'Usuário Demo',
  bio = 'Esta é uma conta de demonstração do AutoPostIA. Explore todas as funcionalidades!',
  plan_type = 'pro'
WHERE email = 'demo@autopostia.com';
