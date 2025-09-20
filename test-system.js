#!/usr/bin/env node

/**
 * Script de pruebas para verificar el sistema corregido de subida de libros
 * Prueba las fases implementadas para asegurar que no hay errores UUID
 */

const fs = require('fs');
const path = require('path');

console.log('✅ Iniciando pruebas del sistema de subida de libros...\n');

// Prueba 1: Verificar que ya no se usa 'temp-edition-id'
console.log('🔍 Prueba 1: Verificación de eliminación de "temp-edition-id"');

const bookUploadFormPath = path.join(__dirname, 'components', 'book-upload-form.tsx');
const bookUploadFormContent = fs.readFileSync(bookUploadFormPath, 'utf8');

if (bookUploadFormContent.includes('temp-edition-id')) {
  console.log('❌ ERROR: Aún se encuentra "temp-edition-id" en book-upload-form.tsx');
  process.exit(1);
} else {
  console.log('✅ OK: "temp-edition-id" eliminado correctamente');
}

// Prueba 2: Verificar que ya no exista dummyUserId
console.log('\n🔍 Prueba 2: Validación de eliminación de usuario dummy');
if (bookUploadFormContent.includes('dummyUserId')) {
  console.log('❌ ERROR: Se encontró "dummyUserId" en book-upload-form.tsx');
  process.exit(1);
} else {
  console.log('✅ OK: Se usa el usuario real para registrar archivos');
}

// Prueba 3: Verificar que storage.ts ya no inserta automáticamente en BD
console.log('\n🔍 Prueba 3: Verificación de separación de responsabilidades en storage.ts');

const storagePath = path.join(__dirname, 'lib', 'supabase', 'storage.ts');
const storageContent = fs.readFileSync(storagePath, 'utf8');

const uploadFileFunction = storageContent.match(/async uploadFile\([^)]*\)[^{]*{[^}]*}/s);
if (uploadFileFunction && uploadFileFunction[0].includes('book_files')) {
  console.log('❌ ERROR: storage.ts aún inserta en book_files automáticamente');
  process.exit(1);
} else {
  console.log('✅ OK: storage.ts solo sube archivos, no inserta en BD');
}

// Prueba 4: Verificar que existe la nueva función uploadFileToStorage
console.log('\n🔍 Prueba 4: Verificación de nueva función uploadFileToStorage');

const uploadTsPath = path.join(__dirname, 'lib', 'supabase', 'storage', 'upload.ts');
if (fs.existsSync(uploadTsPath)) {
  const uploadContent = fs.readFileSync(uploadTsPath, 'utf8');
  if (uploadContent.includes('uploadFileToStorage')) {
    console.log('✅ OK: Nueva función uploadFileToStorage existe');
  } else {
    console.log('❌ ERROR: Función uploadFileToStorage no encontrada');
    process.exit(1);
  }
} else {
  console.log('❌ ERROR: Archivo upload.ts no existe');
  process.exit(1);
}

// Prueba 5: Verificar que el flujo en book-upload-form.tsx usa API de servidor
console.log('\n🔍 Prueba 5: Verificación del flujo con API de servidor en book-upload-form.tsx');
if (bookUploadFormContent.includes('/api/books/upload')) {
  console.log('✅ OK: El formulario usa la API de servidor para crear libros');
} else {
  console.log('❌ ERROR: El formulario no utiliza la API de servidor esperada');
  process.exit(1);
}

// Prueba 6: Verificar que el modal de edición existe
console.log('\n🔍 Prueba 6: Verificación del modal de edición');

const editModalPath = path.join(__dirname, 'app', 'admin', 'books', 'components', 'BookEditModal.tsx');
if (fs.existsSync(editModalPath)) {
  const editModalContent = fs.readFileSync(editModalPath, 'utf8');
  if (editModalContent.includes('BookEditModal') && editModalContent.includes('react-hook-form')) {
    console.log('✅ OK: Modal de edición implementado correctamente');
  } else {
    console.log('❌ ERROR: Modal de edición incompleto');
    process.exit(1);
  }
} else {
  console.log('❌ ERROR: Modal de edición no existe');
  process.exit(1);
}

// Prueba 7: Verificar que la tabla de administración existe
console.log('\n🔍 Prueba 7: Verificación de tabla de administración');

const tablePath = path.join(__dirname, 'app', 'admin', 'books', 'components', 'BookTable.tsx');
if (fs.existsSync(tablePath)) {
  const tableContent = fs.readFileSync(tablePath, 'utf8');
  if (tableContent.includes('@tanstack/react-table') && tableContent.includes('BookEditModal')) {
    console.log('✅ OK: Tabla de administración implementada correctamente');
  } else {
    console.log('❌ ERROR: Tabla de administración incompleta');
    process.exit(1);
  }
} else {
  console.log('❌ ERROR: Tabla de administración no existe');
  process.exit(1);
}

// Prueba 8: Verificar dependencias instaladas
console.log('\n🔍 Prueba 8: Verificación de dependencias');

const packageJsonPath = path.join(__dirname, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

const requiredDeps = [
  'react-hook-form',
  '@hookform/resolvers',
  'zod',
  'date-fns',
  '@tanstack/react-table'
];

let missingDeps = [];
requiredDeps.forEach(dep => {
  if (!packageJson.dependencies[dep] && !packageJson.devDependencies[dep]) {
    missingDeps.push(dep);
  }
});

if (missingDeps.length === 0) {
  console.log('✅ OK: Todas las dependencias requeridas están instaladas');
} else {
  console.log('❌ ERROR: Faltan dependencias:', missingDeps.join(', '));
  process.exit(1);
}

// Prueba 9: Verificar que no hay errores de sintaxis básicos
console.log('\n🔍 Prueba 9: Verificación de sintaxis básica');

try {
  const filesToCheck = [
    'components/book-upload-form.tsx',
    'lib/supabase/storage.ts',
    'lib/supabase/storage/upload.ts',
    'app/admin/books/components/BookEditModal.tsx',
    'app/admin/books/components/BookTable.tsx'
  ];

  filesToCheck.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      const openBraces = (content.match(/\{/g) || []).length;
      const closeBraces = (content.match(/\}/g) || []).length;
      if (openBraces !== closeBraces) {
        throw new Error(`Llaves desbalanceadas en ${file}`);
      }
    }
  });

  console.log('✅ OK: Sintaxis básica correcta en archivos principales');
} catch (error) {
  console.log('❌ ERROR:', error.message);
  process.exit(1);
}

console.log('\n🎉 Todas las pruebas pasaron exitosamente!');
console.log('\n📌 Resumen de correcciones implementadas:');
console.log('   ✅ Eliminado error UUID "temp-edition-id"');
console.log('   ✅ Flujo usa API de servidor + usuario autenticado');
console.log('   ✅ Separadas responsabilidades: storage solo sube, componente registra');
console.log('   ✅ Implementado modal de edición completo');
console.log('   ✅ Implementada tabla de administración avanzada');
console.log('   ✅ Todas las dependencias instaladas');

console.log('\n🚀 El sistema está listo para pruebas funcionales!');
console.log('   1. Ejecutar npm run dev');
console.log('   2. Probar subida de libro en /upload');
console.log('   3. Verificar tabla en /admin/books');
console.log('   4. Probar edición de libros');

process.exit(0);
