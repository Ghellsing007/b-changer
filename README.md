# 📚 B-Changer - Marketplace de Libros PDF

Una plataforma completa para **prestar, comprar y vender libros** con experiencia móvil excepcional. Sube tus PDFs, comparte con la comunidad y lee en cualquier dispositivo.

## 🚀 Inicio Rápido

### 1. Configuración del Entorno

```bash
# Clona el repositorio
git clone <tu-repo>
cd b-changer

# Instala dependencias
npm install

# Configura variables de entorno
cp .env.example .env.local
# Edita .env.local con tus claves de Supabase
```

### 2. Configuración de Supabase

```bash
# Verifica configuración
npm run verify

# Ejecuta migraciones de BD
npm run db:migrate

# Configura Storage (ver STORAGE_SETUP.md)
```

### 3. Desarrollo

```bash
# Inicia servidor de desarrollo
npm run dev

# Abre http://localhost:3000
```

## 📋 Requisitos

- **Node.js** 18+
- **Cuenta Supabase** (gratuita)
- **Proyecto Supabase** configurado

## 🔧 Configuración Detallada

### Variables de Entorno

Crea `.env.local` con:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anonima
SUPABASE_SERVICE_ROLE_KEY=tu_clave_servicio
```

### Base de Datos

Ejecuta las migraciones:

```bash
npm run db:migrate
```

Esto crea todas las tablas necesarias incluyendo `book_files` para PDFs.

### Storage

1. Ve a **Supabase Dashboard > Storage**
2. Crea bucket: `book-files`
3. Configura según `STORAGE_SETUP.md`

## 📱 Características

### ✅ Implementado
- ✅ Autenticación completa
- ✅ Catálogo responsive
- ✅ Navegación móvil
- ✅ Sistema de carritos
- ✅ Gestión de pedidos
- ✅ Infraestructura de archivos PDF

### 🚧 En Desarrollo
- 🔄 Sistema de upload real
- 🔄 Visor de PDFs móvil
- 🔄 Portadas en cards
- 🔄 Funcionalidades de lectura

## 🏗️ Arquitectura

```
b-changer/
├── app/                 # Next.js App Router
├── components/          # Componentes UI
├── lib/                 # Utilidades y configuración
│   ├── supabase/        # Cliente y servicios
│   └── types/          # Definiciones TypeScript
├── scripts/            # Migraciones y utilidades
└── public/             # Assets estáticos
```

## 📊 Scripts Disponibles

```bash
npm run dev          # Servidor de desarrollo
npm run build        # Build de producción
npm run start        # Servidor de producción
npm run lint         # Linting
npm run verify       # Verificar configuración
npm run db:migrate   # Ejecutar migraciones BD
```

## 🔒 Seguridad

- **RLS (Row Level Security)** habilitado en todas las tablas
- **Archivos privados** con URLs firmadas
- **Validación de tipos** con Zod
- **Autenticación requerida** para operaciones sensibles

## 📖 Documentación

- `STORAGE_SETUP.md` - Configuración de Supabase Storage
- `scripts/003_add_file_storage.sql` - Esquema de BD completo

## 🤝 Contribuir

1. Fork el proyecto
2. Crea rama: `git checkout -b feature/nueva-funcionalidad`
3. Commit: `git commit -m 'Agrega nueva funcionalidad'`
4. Push: `git push origin feature/nueva-funcionalidad`
5. Abre Pull Request

## 📄 Licencia

Este proyecto es parte del **Seminario de Proyecto 2** - Grupo 2.

## 🆘 Soporte

Si tienes problemas:

1. Ejecuta `npm run verify` para diagnosticar
2. Revisa `STORAGE_SETUP.md` para configuración
3. Consulta logs en la consola del navegador
4. Abre issue en el repositorio

---

**¡Feliz lectura! 📖✨**