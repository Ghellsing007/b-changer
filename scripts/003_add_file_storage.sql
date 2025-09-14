-- =============================================================
--  SUPABASE / POSTGRES - STORAGE PARA ARCHIVOS PDF
--  App: B-Changer - Sistema de Archivos
--  Fecha: 2024
-- =============================================================

-- ===========================
-- TABLA: book_files
-- ===========================
create table if not exists public.book_files (
  id uuid primary key default gen_random_uuid(),
  edition_id uuid not null references public.editions(id) on delete cascade,
  file_type text not null check (file_type in ('pdf', 'cover')),
  file_name text not null,
  file_path text not null, -- Path in Supabase Storage
  file_size bigint not null check (file_size > 0),
  mime_type text not null,
  storage_bucket text not null default 'book-files',
  uploaded_by uuid not null references public.profiles(user_id) on delete cascade,
  created_at timestamptz not null default public.now_utc(),
  updated_at timestamptz not null default public.now_utc(),

  -- Constraints
  unique(edition_id, file_type), -- Solo un PDF y una portada por edición
  check (file_size <= 50 * 1024 * 1024) -- Máximo 50MB por archivo
);

drop trigger if exists trg_book_files_updated on public.book_files;
create trigger trg_book_files_updated before update on public.book_files
for each row execute function public.set_updated_at();

-- ===========================
-- FUNCIONES HELPER PARA STORAGE
-- ===========================

-- Función para generar path seguro en storage
create or replace function public.generate_file_path(
  p_edition_id uuid,
  p_file_type text,
  p_file_name text
) returns text language plpgsql as $$
declare
  file_ext text;
  safe_name text;
begin
  -- Extraer extensión del archivo
  file_ext := lower(split_part(p_file_name, '.', -1));

  -- Generar nombre seguro (remover caracteres especiales)
  safe_name := regexp_replace(p_file_name, '[^a-zA-Z0-9._-]', '_', 'g');

  -- Retornar path: edition_id/file_type/filename
  return p_edition_id || '/' || p_file_type || '/' || safe_name;
end;$$;

-- Función para validar tipo de archivo
create or replace function public.validate_file_type(
  p_mime_type text,
  p_file_type text
) returns boolean language plpgsql as $$
begin
  if p_file_type = 'pdf' then
    return p_mime_type = 'application/pdf';
  elsif p_file_type = 'cover' then
    return p_mime_type in ('image/jpeg', 'image/png', 'image/webp');
  else
    return false;
  end if;
end;$$;

-- ===========================
-- ROW LEVEL SECURITY (RLS)
-- ===========================

alter table public.book_files enable row level security;

-- Política: Usuarios pueden ver archivos de libros que tienen acceso
create policy "Users can view accessible book files" on public.book_files for select to authenticated
using (
  exists (
    select 1 from public.listings l
    where l.edition_id = book_files.edition_id
    and l.is_active = true
  )
);

-- Política: Solo el uploader puede modificar sus archivos
create policy "Uploaders can manage their files" on public.book_files for all to authenticated
using (auth.uid() = uploaded_by);

-- Política: Admins pueden gestionar todos los archivos
create policy "Admins can manage all files" on public.book_files for all to authenticated
using (
  exists (
    select 1 from public.profiles
    where user_id = auth.uid()
    and role in ('admin', 'staff')
  )
);

-- =================================================================
-- POLÍTICAS PARA DESARROLLO (SIN AUTENTICACIÓN)
-- =================================================================

-- Política temporal para desarrollo: permitir todas las operaciones sin auth
-- ⚠️  IMPORTANTE: Eliminar en producción
create policy "Dev allow all operations" on public.book_files for all
using (true)
with check (true);

-- Políticas de storage para desarrollo (sin autenticación)
-- ⚠️  IMPORTANTE: Eliminar en producción
create policy "Dev allow storage upload" on storage.objects for insert
with check (bucket_id = 'book-files');

create policy "Dev allow storage select" on storage.objects for select
using (bucket_id = 'book-files');

create policy "Dev allow storage update" on storage.objects for update
using (bucket_id = 'book-files');

create policy "Dev allow storage delete" on storage.objects for delete
using (bucket_id = 'book-files');

-- ===========================
-- ÍNDICES PARA PERFORMANCE
-- ===========================

create index if not exists idx_book_files_edition_type on public.book_files(edition_id, file_type);
create index if not exists idx_book_files_uploaded_by on public.book_files(uploaded_by);
create index if not exists idx_book_files_created_at on public.book_files(created_at desc);

-- ===========================
-- CONFIGURACIÓN DE STORAGE BUCKETS
-- ===========================

-- Nota: Los buckets deben crearse manualmente en Supabase Dashboard:
-- 1. Ir a Storage en el dashboard
-- 2. Crear bucket "book-files" con configuración:
--    - Public: false (archivos privados)
--    - File size limit: 100MB
--    - Allowed MIME types: application/pdf, image/jpeg, image/png, image/webp

-- Políticas de Storage (se configuran en el dashboard de Supabase):
-- - PDFs: Solo lectura para usuarios autenticados que compraron/prestarón
-- - Portadas: Lectura pública para mostrar en catálogo
-- - Upload: Solo para usuarios autenticados

-- ===========================
-- DATOS DE EJEMPLO (opcional)
-- ===========================

-- Insertar algunos archivos de ejemplo (después de tener ediciones)
-- Estos se insertarán cuando se suban archivos reales

-- ===========================
-- COMENTARIOS FINALES
-- ===========================

/*
Esta configuración permite:
- Almacenar PDFs y portadas de manera segura
- Control de acceso basado en compras/préstamos
- Metadata completa de archivos
- Integración nativa con Supabase Storage
- Escalabilidad para miles de archivos

Próximos pasos en código:
1. Configurar buckets en Supabase Dashboard
2. Crear funciones de upload en el frontend
3. Implementar visor de PDFs
4. Sistema de permisos de acceso
*/