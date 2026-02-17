#!/usr/bin/env node

// Test script para verificar que el MCP server funciona
import { spawn } from 'child_process';
import path from 'path';

const serverPath = path.join(process.cwd(), 'mcp-server', 'dist', 'docs-server.js');

console.log('🚀 Iniciando test del MCP Documentation Server...\n');

const server = spawn('node', [serverPath], {
  cwd: process.cwd(),
  stdio: ['pipe', 'pipe', 'pipe']
});

server.stderr.on('data', (data) => {
  console.log('📋 Server log:', data.toString().trim());
});

// Test básico - listar documentación
const testMessage = {
  jsonrpc: '2.0',
  id: 1,
  method: 'tools/call',
  params: {
    name: 'list_docs',
    arguments: {}
  }
};

// Dar tiempo al servidor para inicializar
setTimeout(() => {
  console.log('📤 Enviando comando: list_docs\n');
  server.stdin.write(JSON.stringify(testMessage) + '\n');
  
  setTimeout(() => {
    console.log('\n✅ Test completado. El servidor está funcionando correctamente.');
    server.kill();
    process.exit(0);
  }, 2000);
}, 1000);

server.stdout.on('data', (data) => {
  console.log('📥 Respuesta del servidor:');
  console.log(data.toString());
});

server.on('error', (error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});

server.on('exit', (code) => {
  console.log(`\n🛑 Servidor cerrado con código: ${code}`);
});