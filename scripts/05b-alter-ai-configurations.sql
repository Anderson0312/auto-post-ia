-- Colunas extras usadas pelo app (script 05 usa CREATE IF NOT EXISTS e não altera tabelas já criadas)
ALTER TABLE ai_configurations ADD COLUMN IF NOT EXISTS themes TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE ai_configurations ADD COLUMN IF NOT EXISTS language VARCHAR(10) NOT NULL DEFAULT 'pt-BR';
ALTER TABLE ai_configurations ADD COLUMN IF NOT EXISTS post_format VARCHAR(20) NOT NULL DEFAULT 'medium';
