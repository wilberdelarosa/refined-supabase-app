# MCP Documentation Server - Guía de Uso

✅ **¡MCP Server instalado exitosamente!**

## 🎯 ¿Qué es?

Un servidor MCP (Model Context Protocol) que permite consultar toda la documentación de tu proyecto Barbaro de forma inteligente.

## 🚀 Comandos Disponibles

### 📦 Gestión del Servidor
```bash
# Compilar el servidor
npm run mcp:build

# Iniciar el servidor
npm run mcp:start

# Modo desarrollo (recompila automáticamente)  
npm run mcp:dev
```

### 🔍 Herramientas MCP

### 📚 Servidor de Documentación (barbaro-docs)
1. **search_docs** - Buscar en documentación
2. **get_doc** - Obtener documento específico  
3. **list_docs** - Listar todos los documentos
4. **docs_summary** - Resumen de documentación

### 🧠 Context7 (Upstash)
1. **Gestión de contexto avanzada** - Mantiene conversaciones largas
2. **Memoria persistente** - Recuerda información entre sesiones
3. **Análisis de contexto** - Comprende mejor el flujo de trabajo
4. **Optimización automática** - Gestiona eficientemente el contexto

## 📋 Documentación Indexada

El servidor indexa automáticamente:

- ✅ `architecture.md` - Arquitectura del sistema
- ✅ `database-workflows.md` - Workflows de base de datos
- ✅ `deployment.md` - Guía de despliegue  
- ✅ `security.md` - Documentación de seguridad
- ✅ `INVENTARIO_COMPLETO_APP.md` - Inventario completo
- ✅ `PROJECT_ANALYSIS_ECOMMERCE_SIN_NUTRICIONISTA.md` - Análisis del proyecto
- ✅ Todos los archivos en `docs/appointments/` y `docs/supabase/`

## 💡 Ejemplos de Uso

### Con Claude Desktop (recomendado)
Agrega esta configuración a `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "barbaro-docs": {
      "command": "node",
      "args": [
        "C:/ruta/completa/al/proyecto/mcp-server/dist/docs-server.js"
      ],
      "cwd": "C:/ruta/completa/al/proyecto",
      "description": "Servidor de documentación del proyecto Barbaro"
    },
    "Context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp"],
      "description": "Upstash Context7 MCP server for enhanced context management"
    }
  }
}
```

**📋 Configuración incluida:**
- **barbaro-docs**: Tu servidor de documentación personalizado
- **Context7**: Servidor Upstash para gestión avanzada de contexto

### Consultas Típicas

1. **"¿Cómo funciona el sistema de autenticación?"**
   - Se buscará automáticamente en `security.md` y otros docs

2. **"¿Cuál es la arquitectura del proyecto?"**
   - Consultará `architecture.md` y archivos relacionados

3. **"¿Cómo desplegar a producción?"**
   - Buscará en `deployment.md` y guías de despliegue

4. **"¿Qué hay en el inventario completo?"**
   - Consultará `INVENTARIO_COMPLETO_APP.md`

## 📂 Estructura de Archivos

```
mcp-server/
├── docs-server.ts       # Código fuente
├── dist/
│   ├── docs-server.js   # Servidor compilado ✅
│   └── docs-server.d.ts # Tipos TypeScript
├── package.json         # Dependencias MCP
├── tsconfig.json        # Configuración TypeScript
└── README.md           # Documentación detallada
```

## ⚡ Estado Actual

- ✅ **Instalado**: MCP SDK y dependencias
- ✅ **Compilado**: Servidor JavaScript listo
- ✅ **Indexado**: ${new Date().toLocaleDateString()} - Documentación procesada
- ✅ **Scripts**: Comandos npm configurados
- ✅ **Context7**: Servidor Upstash configurado
- ✅ **Configuración dual**: barbaro-docs + Context7
- 🔄 **Listo para usar**: Configura en tu cliente MCP

## 🎯 Próximos Pasos

1. **Configura tu cliente MCP** (Claude Desktop, Cursor, etc.)
2. **Prueba las consultas** sobre la documentación
3. **¡Explora tu proyecto** de forma más eficiente!

---

**💡 Tip**: El servidor lee automáticamente todos los archivos `.md` en `docs/` cada vez que se inicia.