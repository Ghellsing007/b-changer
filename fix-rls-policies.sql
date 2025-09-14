-- =================================================================
-- POLÍTICAS RLS PARA DESARROLLO - EJECUTAR MANUALMENTE
-- =================================================================
-- Ve a Supabase Dashboard > SQL Editor y ejecuta estos comandos

-- 1. POLÍTICAS PARA BOOK_FILES (BASE DE DATOS)
-- =================================================================

-- Política temporal para desarrollo: permitir todas las operaciones
DROP POLICY IF EXISTS "Dev allow all operations" ON public.book_files;
CREATE POLICY "Dev allow all operations" ON public.book_files
FOR ALL USING (true) WITH CHECK (true);

-- 2. POLÍTICAS PARA STORAGE (ARCHIVOS)
-- =================================================================

-- Políticas para upload de archivos
DROP POLICY IF EXISTS "Dev allow storage upload" ON storage.objects;
CREATE POLICY "Dev allow storage upload" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'book-files');

-- Políticas para ver archivos
DROP POLICY IF EXISTS "Dev allow storage select" ON storage.objects;
CREATE POLICY "Dev allow storage select" ON storage.objects
FOR SELECT USING (bucket_id = 'book-files');

-- Políticas para actualizar archivos
DROP POLICY IF EXISTS "Dev allow storage update" ON storage.objects;
CREATE POLICY "Dev allow storage update" ON storage.objects
FOR UPDATE USING (bucket_id = 'book-files');

-- Políticas para eliminar archivos
DROP POLICY IF EXISTS "Dev allow storage delete" ON storage.objects;
CREATE POLICY "Dev allow storage delete" ON storage.objects
FOR DELETE USING (bucket_id = 'book-files');

-- =================================================================
-- VERIFICACIÓN
-- =================================================================

-- Para verificar que las políticas funcionen, ejecuta:
-- SELECT * FROM public.book_files LIMIT 1;
-- Si no hay errores, las políticas están funcionando.

-- =================================================================
-- IMPORTANTE PARA PRODUCCIÓN
-- =================================================================

-- ⚠️  ELIMINAR estas políticas antes de producción
-- ⚠️  Implementar políticas de seguridad reales basadas en autenticación

-- Políticas de producción recomendadas:
-- CREATE POLICY "Users can upload their own files" ON public.book_files
-- FOR INSERT WITH CHECK (auth.uid() = uploaded_by);

-- CREATE POLICY "Users can view accessible files" ON public.book_files
-- FOR SELECT USING (auth.uid() = uploaded_by);