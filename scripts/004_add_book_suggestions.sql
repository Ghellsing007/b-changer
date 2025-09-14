-- Crear tabla para sugerencias de libros
CREATE TABLE IF NOT EXISTS book_suggestions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255),
    description TEXT,
    category VARCHAR(100),
    language VARCHAR(50) DEFAULT 'Español',
    suggested_by UUID REFERENCES profiles(user_id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    votes INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla para votos en sugerencias
CREATE TABLE IF NOT EXISTS suggestion_votes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    suggestion_id UUID REFERENCES book_suggestions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE,
    vote_type VARCHAR(10) DEFAULT 'up' CHECK (vote_type IN ('up', 'down')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(suggestion_id, user_id)
);

-- Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_book_suggestions_status ON book_suggestions(status);
CREATE INDEX IF NOT EXISTS idx_book_suggestions_created_at ON book_suggestions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_suggestion_votes_suggestion_id ON suggestion_votes(suggestion_id);
CREATE INDEX IF NOT EXISTS idx_suggestion_votes_user_id ON suggestion_votes(user_id);

-- Políticas RLS para book_suggestions
ALTER TABLE book_suggestions ENABLE ROW LEVEL SECURITY;

-- Todos pueden ver sugerencias
CREATE POLICY "Anyone can view book suggestions" ON book_suggestions
    FOR SELECT USING (true);

-- Usuarios autenticados pueden crear sugerencias
CREATE POLICY "Authenticated users can create suggestions" ON book_suggestions
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Usuarios pueden actualizar sus propias sugerencias
CREATE POLICY "Users can update own suggestions" ON book_suggestions
    FOR UPDATE USING (auth.uid() = suggested_by);

-- Políticas RLS para suggestion_votes
ALTER TABLE suggestion_votes ENABLE ROW LEVEL SECURITY;

-- Todos pueden ver votos
CREATE POLICY "Anyone can view suggestion votes" ON suggestion_votes
    FOR SELECT USING (true);

-- Usuarios autenticados pueden votar
CREATE POLICY "Authenticated users can vote" ON suggestion_votes
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Usuarios pueden cambiar sus votos
CREATE POLICY "Users can update own votes" ON suggestion_votes
    FOR UPDATE USING (auth.uid() = user_id);

-- Usuarios pueden eliminar sus votos
CREATE POLICY "Users can delete own votes" ON suggestion_votes
    FOR DELETE USING (auth.uid() = user_id);

-- Función para actualizar contador de votos
CREATE OR REPLACE FUNCTION update_suggestion_votes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.vote_type = 'up' THEN
            UPDATE book_suggestions SET votes = votes + 1 WHERE id = NEW.suggestion_id;
        ELSE
            UPDATE book_suggestions SET votes = votes - 1 WHERE id = NEW.suggestion_id;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.vote_type = 'up' THEN
            UPDATE book_suggestions SET votes = votes - 1 WHERE id = OLD.suggestion_id;
        ELSE
            UPDATE book_suggestions SET votes = votes + 1 WHERE id = OLD.suggestion_id;
        END IF;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.vote_type = 'up' AND NEW.vote_type = 'down' THEN
            UPDATE book_suggestions SET votes = votes - 2 WHERE id = NEW.suggestion_id;
        ELSIF OLD.vote_type = 'down' AND NEW.vote_type = 'up' THEN
            UPDATE book_suggestions SET votes = votes + 2 WHERE id = NEW.suggestion_id;
        END IF;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar votos automáticamente
CREATE TRIGGER trigger_update_suggestion_votes
    AFTER INSERT OR UPDATE OR DELETE ON suggestion_votes
    FOR EACH ROW EXECUTE FUNCTION update_suggestion_votes();