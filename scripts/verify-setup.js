#!/usr/bin/env node

/**
 * Script para verificar la configuración de Supabase
 * Ejecuta pruebas para confirmar que todo esté configurado correctamente
 */

const { createClient } = require('@supabase/supabase-js')

// Cargar variables de entorno desde .env.local
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') })

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('🔍 Verificando configuración de B-Changer...\n')

// Verificar variables de entorno
function checkEnvironmentVariables() {
  console.log('📋 Verificando variables de entorno...')

  const required = [
    { name: 'NEXT_PUBLIC_SUPABASE_URL', value: supabaseUrl },
    { name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', value: supabaseAnonKey },
    { name: 'SUPABASE_SERVICE_ROLE_KEY', value: supabaseServiceKey }
  ]

  let allPresent = true

  required.forEach(({ name, value }) => {
    if (!value) {
      console.log(`❌ ${name}: No configurada`)
      allPresent = false
    } else {
      console.log(`✅ ${name}: Configurada`)
    }
  })

  if (!allPresent) {
    console.log('\n💡 Para configurar:')
    console.log('1. Copia .env.example como .env.local')
    console.log('2. Ve a https://supabase.com/dashboard')
    console.log('3. Obtén las claves de Settings > API')
    console.log('4. Actualiza .env.local con tus valores\n')
    return false
  }

  console.log('✅ Todas las variables de entorno están configuradas\n')
  return true
}

// Verificar conexión con Supabase
async function checkSupabaseConnection() {
  console.log('🔗 Verificando conexión con Supabase...')

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // Intentar una consulta simple
    const { data, error } = await supabase.from('profiles').select('count').limit(1)

    if (error) {
      console.log(`❌ Error de conexión: ${error.message}`)
      console.log('💡 Posibles causas:')
      console.log('   - URL o claves incorrectas')
      console.log('   - Proyecto Supabase no existe')
      console.log('   - Problemas de red\n')
      return false
    }

    console.log('✅ Conexión con Supabase exitosa\n')
    return true

  } catch (error) {
    console.log(`❌ Error inesperado: ${error.message}\n`)
    return false
  }
}

// Verificar tablas de base de datos
async function checkDatabaseTables() {
  console.log('🗄️  Verificando tablas de base de datos...')

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const requiredTables = [
      'profiles',
      'books',
      'editions',
      'listings',
      'book_files'
    ]

    let allTablesExist = true

    for (const tableName of requiredTables) {
      try {
        const { error } = await supabase.from(tableName).select('*').limit(1)

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
          console.log(`❌ Tabla '${tableName}': Error - ${error.message}`)
          allTablesExist = false
        } else {
          console.log(`✅ Tabla '${tableName}': OK`)
        }
      } catch (error) {
        console.log(`❌ Tabla '${tableName}': Error - ${error.message}`)
        allTablesExist = false
      }
    }

    if (!allTablesExist) {
      console.log('\n💡 Para crear las tablas:')
      console.log('1. Ejecuta: npm run db:migrate')
      console.log('2. O copia el SQL de scripts/003_add_file_storage.sql')
      console.log('3. Ejecuta manualmente en Supabase SQL Editor\n')
    } else {
      console.log('✅ Todas las tablas existen\n')
    }

    return allTablesExist

  } catch (error) {
    console.log(`❌ Error verificando tablas: ${error.message}\n`)
    return false
  }
}

// Verificar bucket de storage
async function checkStorageBucket() {
  console.log('🗄️  Verificando bucket de storage...')

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data, error } = await supabase.storage.listBuckets()

    if (error) {
      console.log(`❌ Error accediendo a storage: ${error.message}`)
      console.log('💡 Asegúrate de que el service role tenga permisos de storage\n')
      return false
    }

    const bookFilesBucket = data.find(bucket => bucket.name === 'book-files')

    if (!bookFilesBucket) {
      console.log(`❌ Bucket 'book-files' no encontrado`)
      console.log('💡 Para crear el bucket:')
      console.log('1. Ve a Supabase Dashboard > Storage')
      console.log('2. Crea bucket: book-files')
      console.log('3. Configura según STORAGE_SETUP.md\n')
      return false
    }

    console.log('✅ Bucket book-files encontrado\n')
    return true

  } catch (error) {
    console.log(`❌ Error verificando storage: ${error.message}\n`)
    return false
  }
}

// Función principal
async function main() {
  console.log('🚀 Verificación completa de configuración\n')

  const checks = [
    { name: 'Variables de entorno', fn: checkEnvironmentVariables },
    { name: 'Conexión Supabase', fn: checkSupabaseConnection },
    { name: 'Tablas BD', fn: checkDatabaseTables },
    { name: 'Bucket Storage', fn: checkStorageBucket }
  ]

  let allPassed = true

  for (const check of checks) {
    console.log(`\n${'='.repeat(50)}`)
    console.log(`🔍 ${check.name}`)
    console.log(`${'='.repeat(50)}`)

    const passed = await check.fn()
    if (!passed) {
      allPassed = false
    }
  }

  console.log(`\n${'='.repeat(50)}`)
  if (allPassed) {
    console.log('🎉 ¡Configuración completa y correcta!')
    console.log('✅ Puedes proceder con la implementación')
    console.log('💡 Próximo paso: npm run dev')
  } else {
    console.log('⚠️  Configuración incompleta')
    console.log('❌ Revisa los errores arriba y corrígelos')
    console.log('📖 Consulta STORAGE_SETUP.md para más detalles')
  }
  console.log(`${'='.repeat(50)}\n`)

  if (!allPassed) {
    process.exit(1)
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Error fatal:', error.message)
    process.exit(1)
  })
}

module.exports = { main }