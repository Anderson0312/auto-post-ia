-- Seed initial data for AutoPostIA

-- Insert sample user (for development)
INSERT INTO users (id, email, name, phone, bio, timezone, language, post_format, plan_type) VALUES
(
    '550e8400-e29b-41d4-a716-446655440000',
    'demo@autopostia.com',
    'Usuário Demo',
    '+55 11 99999-9999',
    'Empreendedor digital apaixonado por tecnologia e inovação.',
    'America/Sao_Paulo',
    'pt-BR',
    'medium',
    'free'
);

-- Insert user settings for demo user
INSERT INTO user_settings (user_id, email_notifications, push_notifications, post_success_notifications, post_failure_notifications, weekly_reports, monthly_reports, system_updates, marketing_emails, two_factor_enabled, login_alerts, session_timeout) VALUES
(
    '550e8400-e29b-41d4-a716-446655440000',
    true,
    true,
    true,
    true,
    true,
    false,
    true,
    false,
    false,
    true,
    '24h'
);

-- Insert sample AI themes
INSERT INTO ai_themes (user_id, name, description, is_active) VALUES
(
    '550e8400-e29b-41d4-a716-446655440000',
    'Produtividade e Organização',
    'Dicas e estratégias para melhorar a produtividade pessoal e profissional',
    true
),
(
    '550e8400-e29b-41d4-a716-446655440000',
    'Marketing Digital',
    'Tendências, estratégias e insights sobre marketing digital',
    true
),
(
    '550e8400-e29b-41d4-a716-446655440000',
    'Empreendedorismo',
    'Conteúdo sobre empreendedorismo, startups e negócios',
    true
);

-- Insert AI configuration for demo user
INSERT INTO ai_configurations (user_id, posts_per_day, post_times, post_objective, content_style, generate_images, custom_instructions, is_active) VALUES
(
    '550e8400-e29b-41d4-a716-446655440000',
    2,
    ARRAY['09:00', '15:00'],
    'engagement',
    'professional',
    true,
    'Sempre incluir uma pergunta no final do post para gerar engajamento. Usar emojis moderadamente.',
    true
);

-- Insert sample social accounts (mock data)
INSERT INTO social_accounts (user_id, platform, platform_user_id, username, display_name, is_active, is_connected, followers_count) VALUES
(
    '550e8400-e29b-41d4-a716-446655440000',
    'instagram',
    'mock_instagram_id',
    '@meuinstagram',
    'Meu Instagram',
    true,
    true,
    2500
),
(
    '550e8400-e29b-41d4-a716-446655440000',
    'linkedin',
    'mock_linkedin_id',
    'Meu Perfil LinkedIn',
    'João Silva',
    true,
    true,
    1200
);

-- Insert sample posts
INSERT INTO posts (user_id, social_account_id, content, status, scheduled_for, published_at, likes_count, comments_count, views_count, engagement_rate) VALUES
(
    '550e8400-e29b-41d4-a716-446655440000',
    (SELECT id FROM social_accounts WHERE platform = 'instagram' AND user_id = '550e8400-e29b-41d4-a716-446655440000'),
    'Dicas de produtividade para empreendedores que querem otimizar seu tempo! 🚀 Como você organiza suas tarefas diárias? #produtividade #empreendedorismo',
    'published',
    NOW() - INTERVAL '2 hours',
    NOW() - INTERVAL '2 hours',
    45,
    12,
    234,
    6.2
),
(
    '550e8400-e29b-41d4-a716-446655440000',
    (SELECT id FROM social_accounts WHERE platform = 'linkedin' AND user_id = '550e8400-e29b-41d4-a716-446655440000'),
    'Como a IA está transformando o marketing digital: tendências que todo profissional precisa conhecer. O futuro já chegou! 🤖',
    'scheduled',
    NOW() + INTERVAL '1 day',
    NULL,
    0,
    0,
    0,
    0
),
(
    '550e8400-e29b-41d4-a716-446655440000',
    (SELECT id FROM social_accounts WHERE platform = 'instagram' AND user_id = '550e8400-e29b-41d4-a716-446655440000'),
    'Tendências de design para 2024 que vão revolucionar a experiência do usuário! ✨ Qual é a sua favorita?',
    'failed',
    NOW() - INTERVAL '1 day',
    NULL,
    0,
    0,
    0,
    0
);

-- Insert usage tracking for current month
INSERT INTO usage_tracking (user_id, month_year, posts_created, posts_published, ai_generations, api_calls) VALUES
(
    '550e8400-e29b-41d4-a716-446655440000',
    TO_CHAR(NOW(), 'YYYY-MM'),
    24,
    23,
    24,
    156
);

-- Insert billing record for demo user
INSERT INTO billing (user_id, plan_type, status, current_period_start, current_period_end) VALUES
(
    '550e8400-e29b-41d4-a716-446655440000',
    'free',
    'active',
    DATE_TRUNC('month', NOW()),
    DATE_TRUNC('month', NOW()) + INTERVAL '1 month' - INTERVAL '1 day'
);
