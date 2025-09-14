#!/usr/bin/env node

/**
 * Script de prueba para validar el sistema de upload
 * Verifica que todos los componentes estén correctamente configurados
 */

const fs = require('fs')
const path = require('path')

console.log('🧪 Probando configuración del sistema de upload...\n')

// Verificar archivos creados
const requiredFiles = [
  'hooks/useFileUpload.ts',
  'components/FileUploader.tsx',
  'components/book-upload-form.tsx',
  'lib/supabase/storage.ts',
  'lib/types/database.ts'
]

console.log('📁 Verificando archivos creados:')
let allFilesExist = true

requiredFiles.forEach(file => {
  const filePath = path.join(__dirname, file)
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file}`)
  } else {
    console.log(`❌ ${file} - NO ENCONTRADO`)
    allFilesExist = false
  }
})

if (!allFilesExist) {
  console.log('\n💥 Faltan archivos importantes. Revisa la implementación.')
  process.exit(1)
}

console.log('\n✅ Todos los archivos están presentes\n')

// Verificar dependencias
console.log('📦 Verificando dependencias:')
const packageJson = require('./package.json')
const requiredDeps = [
  '@supabase/supabase-js',
  'react',
  'next'
]

requiredDeps.forEach(dep => {
  if (packageJson.dependencies[dep]) {
    console.log(`✅ ${dep}: ${packageJson.dependencies[dep]}`)
  } else {
    console.log(`❌ ${dep}: NO ENCONTRADO`)
  }
})

console.log('\n🎯 Próximos pasos para probar:')
console.log('1. npm run dev')
console.log('2. Ve a http://localhost:3000/upload')
console.log('3. Intenta subir un PDF pequeño (< 1MB)')
console.log('4. Verifica que aparezca en el catálogo')
console.log('5. Prueba con un archivo muy grande (> 50MB)')
console.log('6. Prueba sin iniciar sesión')

console.log('\n📋 Casos de prueba importantes:')
console.log('✅ PDF válido + formulario completo → Debe funcionar')
console.log('❌ Sin PDF → Debe mostrar error')
console.log('❌ Archivo muy grande → Debe rechazar')
console.log('❌ Sin título/autor → Debe validar')
console.log('❌ Usuario no autenticado → Debe redirigir')

console.log('\n🚀 ¡Listo para probar! Ejecuta: npm run dev')