# 🗄️ Configuración de Supabase Storage para B-Changer

## 📋 Requisitos Previos

1. **Proyecto Supabase configurado** con autenticación
2. **Variables de entorno** configuradas:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
   ```

## 🚀 Configuración Automática

### 1. Ejecutar Migración de Base de Datos

```bash
# Instalar dependencias si es necesario
npm install

# Ejecutar migración (crea tabla book_files)
npm run db:migrate
```

### 2. Configurar Bucket de Storage Manualmente

Ve al **Supabase Dashboard > Storage** y crea un nuevo bucket:

#### Crear Bucket "book-files"
1. **Nombre**: `book-files`
2. **Público**: ❌ No (archivos privados)
3. **Límite de tamaño**: 100MB por archivo
4. **Tipos MIME permitidos**:
   - `application/pdf`
   - `image/jpeg`
   - `image/png`
   - `image/webp`

## 🔐 Configuración de Políticas de Storage

### Políticas para PDFs (Archivos Privados)
```sql
-- Solo usuarios autenticados pueden subir PDFs
CREATE POLICY "Users can upload PDFs" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'book-files'
  AND (storage.foldername(name))[2] = 'pdf'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Solo propietarios pueden ver sus PDFs
CREATE POLICY "Users can view their PDFs" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'book-files'
  AND (storage.foldername(name))[2] = 'pdf'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

### Políticas para Portadas (Archivos Públicos)
```sql
-- Usuarios autenticados pueden subir portadas
CREATE POLICY "Users can upload covers" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'book-files'
  AND (storage.foldername(name))[2] = 'cover'
);

-- Cualquier usuario puede ver portadas (para catálogo)
CREATE POLICY "Anyone can view covers" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'book-files'
  AND (storage.foldername(name))[2] = 'cover'
);
```

## 📁 Estructura de Archivos

```
book-files/
├── {edition_id}/
│   ├── pdf/
│   │   └── {edition_id}_pdf_{timestamp}.pdf
│   └── cover/
│       └── {edition_id}_cover_{timestamp}.jpg
```

### Ejemplo:
```
book-files/
├── 123e4567-e89b-12d3-a456-426614174000/
│   ├── pdf/
│   │   └── 123e4567-e89b-12d3-a456-426614174000_pdf_1703123456789.pdf
│   └── cover/
│       └── 123e4567-e89b-12d3-a456-426614174000_cover_1703123456789.jpg
```

## 🧪 Verificación de Configuración

### 1. Verificar Tabla `book_files`
```sql
SELECT * FROM book_files LIMIT 5;
```

### 2. Verificar Bucket de Storage
- Ve a **Storage** en el dashboard
- Confirma que existe el bucket `book-files`
- Verifica que las políticas estén aplicadas

### 3. Probar Upload (desde la aplicación)
1. Ve a `/upload` en tu aplicación
2. Sube un PDF y una portada
3. Verifica que se guarden correctamente en Storage y BD

## 🔧 Solución de Problemas

### Error: "Bucket does not exist"
- Asegúrate de crear el bucket manualmente en el dashboard
- Verifica el nombre exacto: `book-files`

### Error: "Access denied"
- Revisa las políticas RLS en Storage
- Confirma que el usuario esté autenticado

### Error: "File too large"
- Verifica el límite de 100MB en la configuración del bucket
- Comprime el PDF si es necesario

## 📚 Próximos Pasos

Una vez configurado el storage:

1. **Fase 2**: Implementar sistema de upload real
2. **Fase 3**: Crear visor de PDFs móvil
3. **Fase 4**: Mostrar portadas en cards
4. **Fase 5**: Agregar funcionalidades de lectura

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs de la aplicación
2. Verifica la configuración en Supabase Dashboard
3. Consulta la documentación de Supabase Storage