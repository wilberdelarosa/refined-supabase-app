# Barbaro Documentation MCP Server

Un servidor MCP (Model Context Protocol) para consultar y gestionar la documentación del proyecto Barbaro.

## Funcionalidades

### 🔍 Herramientas Disponibles

1. **search_docs** - Busca en toda la documentación por palabras clave
2. **get_doc** - Obtiene el contenido completo de un archivo específico  
3. **list_docs** - Lista todos los archivos de documentación disponibles
4. **docs_summary** - Obtiene un resumen de la estructura de documentación

### 📁 Documentación Indexada

El servidor automáticamente indexa todos los archivos `.md` en la carpeta `docs/` del proyecto:

- `architecture.md` - Arquitectura del sistema
- `database-workflows.md` - Flujos de trabajo de base de datos  
- `deployment.md` - Guía de despliegue
- `security.md` - Documentación de seguridad
- Y todos los demás archivos en subcarpetas como `appointments/`, `supabase/`, etc.

## Instalación y Uso

### 1. Instalar dependencias
```bash
cd mcp-server
npm install
```

### 2. Compilar el servidor
```bash
npm run build
```

### 3. Ejecutar el servidor
```bash
npm start
```

### 4. Configurar en tu cliente MCP
Agrega esta configuración a tu cliente MCP:

```json
{
  "mcpServers": {
    "barbaro-docs": {
      "command": "node",
      "args": [
        "/ruta/al/proyecto/mcp-server/dist/docs-server.js"
      ],
      "cwd": "/ruta/al/proyecto"
    }
  }
}
```

## Ejemplos de Uso

### Buscar información sobre despliegue
```
Usar herramienta: search_docs
Argumentos: {"query": "deployment", "limit": 3}
```

### Obtener la guía de seguridad completa  
```
Usar herramienta: get_doc
Argumentos: {"path": "security.md"}
```

### Listar toda la documentación
```
Usar herramienta: list_docs
```

### Ver resumen de la documentación
```
Usar herramienta: docs_summary
```

## Desarrollo

### Ejecutar en modo desarrollo
```bash
npm run dev
```

### Estructura de archivos
```
mcp-server/
├── docs-server.ts    # Servidor principal
├── package.json      # Dependencias y scripts
├── tsconfig.json     # Configuración TypeScript
└── dist/            # Archivos compilados
```

## Características Técnicas

- **Indexación automática**: Se actualiza al reiniciar el servidor
- **Búsqueda contextual**: Devuelve fragmentos relevantes con contexto
- **Múltiples formatos**: Soporte para archivos Markdown
- **Filtrado inteligente**: Búsqueda por título y contenido
- **Metadatos**: Incluye fechas de modificación y tamaños de archivo

## Requisitos

- Node.js 18+
- TypeScript
- Proyecto con carpeta `docs/` conteniendo archivos `.md`