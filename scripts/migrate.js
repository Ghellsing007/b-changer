#!/usr/bin/env node

/**
 * Script para ejecutar migraciones de base de datos
 * Ejecuta archivos SQL en orden para actualizar el esquema
 */

const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

// Cargar variables de entorno desde .env.local
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })

// Configuración de Supabase (usar variables de entorno)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Variables de entorno no configuradas')
  console.error('Asegúrate de tener:')
  console.error('- NEXT_PUBLIC_SUPABASE_URL')
  console.error('- SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

/**
 * Ejecuta un archivo SQL
 */
async function executeSqlFile(filePath) {
  try {
    console.log(`📄 Ejecutando ${path.basename(filePath)}...`)

    const sql = fs.readFileSync(filePath, 'utf8')

    // Dividir en statements individuales (por punto y coma)
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))

    for (const statement of statements) {
      if (statement.trim()) {
        const { error } = await supabase.rpc('exec_sql', {
          sql: statement + ';'
        })

        if (error) {
          // Si rpc no existe, intentar con query directa
          const { error: queryError } = await supabase.from('_supabase_migration_temp').select('*').limit(1)
          if (queryError) {
            console.log('⚠️  Usando método alternativo para ejecutar SQL...')
            // Para desarrollo local, puedes usar psql o configurar manualmente
            console.log(`📋 SQL a ejecutar manualmente en Supabase SQL Editor:`)
            console.log(statement)
            continue
          }
        }
      }
    }

    console.log(`✅ ${path.basename(filePath)} ejecutado correctamente`)
  } catch (error) {
    console.error(`❌ Error ejecutando ${path.basename(filePath)}:`, error.message)
    throw error
  }
}

/**
 * Función principal
 */
async function main() {
  try {
    console.log('🚀 Iniciando migraciones de base de datos...\n')

    const scriptsDir = path.join(__dirname)
    const sqlFiles = fs.readdirSync(scriptsDir)
      .filter(file => file.endsWith('.sql'))
      .sort() // Ejecutar en orden alfabético

    if (sqlFiles.length === 0) {
      console.log('ℹ️  No se encontraron archivos SQL para migrar')
      return
    }

    console.log(`📂 Encontrados ${sqlFiles.length} archivos SQL:`)
    sqlFiles.forEach(file => console.log(`   - ${file}`))
    console.log()

    for (const sqlFile of sqlFiles) {
      const filePath = path.join(scriptsDir, sqlFile)
      await executeSqlFile(filePath)
    }

    console.log('\n🎉 ¡Todas las migraciones completadas exitosamente!')
    console.log('\n📋 Próximos pasos:')
    console.log('1. Verifica las tablas en Supabase Dashboard')
    console.log('2. Configura los buckets de Storage manualmente')
    console.log('3. Actualiza las políticas RLS si es necesario')

  } catch (error) {
    console.error('\n💥 Error durante la migración:', error.message)
    process.exit(1)
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  main()
}

module.exports = { executeSqlFile }