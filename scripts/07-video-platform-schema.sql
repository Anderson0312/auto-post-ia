-- Video platform schema (Phase 1)

CREATE TABLE IF NOT EXISTS virtual_avatars (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT DEFAULT '',
    apparent_age INTEGER,
    gender VARCHAR(50),
    nationality VARCHAR(100),
    language VARCHAR(10) DEFAULT 'pt-BR',
    voice_tone VARCHAR(100),
    personality TEXT,
    niche VARCHAR(255),
    visual_style VARCHAR(255),
    default_clothing TEXT,
    default_expressions TEXT,
    master_prompt TEXT,
    main_image_url TEXT,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS avatar_assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    avatar_id UUID NOT NULL REFERENCES virtual_avatars(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    asset_type VARCHAR(50) NOT NULL DEFAULT 'reference',
    storage_path TEXT NOT NULL,
    public_url TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS content_projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    avatar_id UUID REFERENCES virtual_avatars(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    prompt TEXT,
    objective VARCHAR(50) DEFAULT 'engagement',
    target_platform VARCHAR(50) DEFAULT 'instagram',
    duration_seconds INTEGER DEFAULT 30,
    creation_mode VARCHAR(50) DEFAULT 'free_prompt',
    status VARCHAR(50) DEFAULT 'draft',
    thumbnail_url TEXT,
    final_video_url TEXT,
    config JSONB DEFAULT '{}',
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS project_scripts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES content_projects(id) ON DELETE CASCADE,
    version INTEGER DEFAULT 1,
    hook TEXT,
    body TEXT,
    cta TEXT,
    full_script TEXT,
    structure JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS project_scenes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES content_projects(id) ON DELETE CASCADE,
    scene_order INTEGER NOT NULL DEFAULT 0,
    title VARCHAR(255),
    description TEXT,
    visual_prompt TEXT,
    duration_seconds INTEGER DEFAULT 5,
    provider VARCHAR(50),
    image_url TEXT,
    video_url TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS media_assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES content_projects(id) ON DELETE SET NULL,
    avatar_id UUID REFERENCES virtual_avatars(id) ON DELETE SET NULL,
    asset_type VARCHAR(50) NOT NULL,
    storage_path TEXT NOT NULL,
    public_url TEXT,
    provider VARCHAR(50),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS generation_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES content_projects(id) ON DELETE CASCADE,
    scene_id UUID REFERENCES project_scenes(id) ON DELETE SET NULL,
    avatar_id UUID REFERENCES virtual_avatars(id) ON DELETE SET NULL,
    provider VARCHAR(50) NOT NULL,
    job_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    external_job_id VARCHAR(255),
    input_data JSONB DEFAULT '{}',
    output_data JSONB DEFAULT '{}',
    error_message TEXT,
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_virtual_avatars_user_id ON virtual_avatars(user_id);
CREATE INDEX IF NOT EXISTS idx_virtual_avatars_status ON virtual_avatars(user_id, status);
CREATE INDEX IF NOT EXISTS idx_avatar_assets_avatar_id ON avatar_assets(avatar_id);
CREATE INDEX IF NOT EXISTS idx_content_projects_user_id ON content_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_content_projects_status ON content_projects(user_id, status);
CREATE INDEX IF NOT EXISTS idx_project_scripts_project_id ON project_scripts(project_id);
CREATE INDEX IF NOT EXISTS idx_project_scenes_project_id ON project_scenes(project_id);
CREATE INDEX IF NOT EXISTS idx_media_assets_user_id ON media_assets(user_id);
CREATE INDEX IF NOT EXISTS idx_generation_jobs_project_id ON generation_jobs(project_id);
CREATE INDEX IF NOT EXISTS idx_generation_jobs_status ON generation_jobs(status);

CREATE TRIGGER update_virtual_avatars_updated_at
    BEFORE UPDATE ON virtual_avatars
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_projects_updated_at
    BEFORE UPDATE ON content_projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_scenes_updated_at
    BEFORE UPDATE ON project_scenes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_generation_jobs_updated_at
    BEFORE UPDATE ON generation_jobs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
