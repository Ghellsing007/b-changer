#!/usr/bin/env node

/**
 * Script de prueba rápida para verificar autenticación
 */

console.log('🧪 PRUEBA DE AUTENTICACIÓN')
console.log('==========================')

console.log('\n📋 INSTRUCCIONES:')
console.log('1. Abre el navegador en una nueva pestaña')
console.log('2. Ve a: http://localhost:3000/catalog')
console.log('3. Deberías ser redirigido a: /auth/login?redirect=%2Fcatalog')
console.log('4. Inicia sesión con tus credenciales')
console.log('5. Deberías ser redirigido automáticamente a: /catalog')

console.log('\n🔍 LOGS A VERIFICAR:')
console.log('- 🔥 LOGIN PAGE LOADED')
console.log('- 🎯 REDIRECT TO: /catalog')
console.log('- 🚀 LOGIN ATTEMPT')
console.log('- ✅ LOGIN SUCCESS!')
console.log('- 🎯 REDIRECTING TO: /catalog')

console.log('\n⚠️  SI NO FUNCIONA:')
console.log('- Revisa la consola del navegador (F12)')
console.log('- Busca errores en rojo')
console.log('- Verifica que las variables de entorno estén configuradas')
console.log('- Asegúrate de que el servidor esté corriendo (npm run dev)')

console.log('\n🚀 ¡LISTO PARA PROBAR!')
console.log('==========================')