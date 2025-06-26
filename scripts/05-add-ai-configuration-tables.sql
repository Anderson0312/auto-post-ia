-- Tabela para configurações da IA
CREATE TABLE IF NOT EXISTS ai_configurations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    themes TEXT[] NOT NULL DEFAULT '{}',
    posts_per_day INTEGER NOT NULL DEFAULT 2,
    post_times TEXT[] NOT NULL DEFAULT '{"09:00", "15:00"}',
    content_style VARCHAR(50) NOT NULL DEFAULT 'professional',
    generate_images BOOLEAN NOT NULL DEFAULT true,
    post_objective VARCHAR(50) NOT NULL DEFAULT 'engagement',
    custom_instructions TEXT DEFAULT '',
    language VARCHAR(10) NOT NULL DEFAULT 'pt-BR',
    post_format VARCHAR(20) NOT NULL DEFAULT 'medium',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para temas personalizados da IA
CREATE TABLE IF NOT EXISTS ai_themes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT DEFAULT '',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_ai_configurations_user_id ON ai_configurations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_configurations_active ON ai_configurations(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_ai_themes_user_id ON ai_themes(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_themes_active ON ai_themes(user_id, is_active);

-- Constraint para garantir apenas uma configuração ativa por usuário
CREATE UNIQUE INDEX IF NOT EXISTS idx_ai_configurations_user_active 
ON ai_configurations(user_id) WHERE is_active = true;

-- Constraint para evitar temas duplicados por usuário
CREATE UNIQUE INDEX IF NOT EXISTS idx_ai_themes_user_name 
ON ai_themes(user_id, LOWER(name)) WHERE is_active = true;
