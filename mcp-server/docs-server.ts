#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import fs from 'fs';
import path from 'path';

class DocumentationServer {
  private server: Server;
  private docsPath: string;
  private documentIndex: Map<string, any> = new Map();

  constructor() {
    this.server = new Server(
      {
        name: 'barbaro-docs-server',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Set docs path relative to project root
    this.docsPath = path.resolve(process.cwd(), 'docs');
    this.setupToolHandlers();
    this.indexDocuments();
  }

  private async indexDocuments() {
    if (!fs.existsSync(this.docsPath)) {
      console.error(`Documentation path not found: ${this.docsPath}`);
      return;
    }

    const indexDir = (dirPath: string) => {
      const files = fs.readdirSync(dirPath);
      
      for (const file of files) {
        const fullPath = path.join(dirPath, file);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          indexDir(fullPath);
        } else if (file.endsWith('.md')) {
          try {
            const content = fs.readFileSync(fullPath, 'utf-8');
            const relativePath = path.relative(this.docsPath, fullPath);
            
            this.documentIndex.set(relativePath, {
              title: this.extractTitle(content),
              content,
              path: fullPath,
              relative: relativePath,
              size: content.length,
              lastModified: stat.mtime
            });
          } catch (error) {
            console.error(`Error indexing ${fullPath}:`, error);
          }
        }
      }
    };

    indexDir(this.docsPath);
    console.log(`Indexed ${this.documentIndex.size} documentation files`);
  }

  private extractTitle(content: string): string {
    const titleMatch = content.match(/^#\s+(.+)$/m);
    if (titleMatch) return titleMatch[1];
    
    const firstLine = content.split('\n')[0];
    return firstLine.replace(/^#+\s*/, '') || 'Untitled';
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'search_docs',
          description: 'Search through project documentation by keyword or phrase',
          inputSchema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'Search query for documentation content'
              },
              limit: {
                type: 'number',
                description: 'Maximum number of results to return (default: 5)',
                default: 5
              }
            },
            required: ['query']
          }
        },
        {
          name: 'get_doc',
          description: 'Get full content of a specific documentation file',
          inputSchema: {
            type: 'object',
            properties: {
              path: {
                type: 'string',
                description: 'Relative path to the documentation file'
              }
            },
            required: ['path']
          }
        },
        {
          name: 'list_docs',
          description: 'List all available documentation files with their titles',
          inputSchema: {
            type: 'object',
            properties: {
              filter: {
                type: 'string',
                description: 'Optional filter by filename or path'
              }
            }
          }
        },
        {
          name: 'docs_summary',
          description: 'Get a summary of the documentation structure and key topics',
          inputSchema: {
            type: 'object',
            properties: {}
          }
        }
      ]
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      if (!args) {
        throw new McpError(ErrorCode.InvalidParams, 'Arguments are required');
      }

      try {
        switch (name) {
          case 'search_docs':
            return await this.searchDocs(
              args.query as string, 
              (args.limit as number) || 5
            );
          
          case 'get_doc':
            return await this.getDoc(args.path as string);
          
          case 'list_docs':
            return await this.listDocs(args.filter as string | undefined);
          
          case 'docs_summary':
            return await this.getDocsSummary();
          
          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Tool ${name} not found`
            );
        }
      } catch (error) {
        throw new McpError(
          ErrorCode.InternalError,
          `Error executing ${name}: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    });
  }

  private async searchDocs(query: string, limit: number) {
    const results: any[] = [];
    const searchTerm = query.toLowerCase();

    for (const [path, doc] of this.documentIndex) {
      const titleMatch = doc.title.toLowerCase().includes(searchTerm);
      const contentMatch = doc.content.toLowerCase().includes(searchTerm);
      
      if (titleMatch || contentMatch) {
        // Extract context around matches
        const context = this.extractContext(doc.content, searchTerm);
        
        results.push({
          path: doc.relative,
          title: doc.title,
          context,
          relevance: titleMatch ? 10 : (contentMatch ? 5 : 0),
          size: doc.size
        });
      }
    }

    // Sort by relevance
    results.sort((a, b) => b.relevance - a.relevance);
    
    return {
      content: [
        {
          type: 'text',
          text: `Found ${results.length} documents matching "${query}":\n\n` +
            results.slice(0, limit).map(r => 
              `**${r.title}** (${r.path})\n${r.context}\n`
            ).join('\n---\n\n')
        }
      ]
    };
  }

  private extractContext(content: string, searchTerm: string, contextLength = 200) {
    const index = content.toLowerCase().indexOf(searchTerm);
    if (index === -1) return content.substring(0, contextLength) + '...';
    
    const start = Math.max(0, index - contextLength / 2);
    const end = Math.min(content.length, index + searchTerm.length + contextLength / 2);
    
    let context = content.substring(start, end);
    if (start > 0) context = '...' + context;
    if (end < content.length) context = context + '...';
    
    return context;
  }

  private async getDoc(filePath: string) {
    const doc = this.documentIndex.get(filePath);
    if (!doc) {
      throw new Error(`Documentation file not found: ${filePath}`);
    }

    return {
      content: [
        {
          type: 'text',
          text: `# ${doc.title}\n\n**File:** ${doc.relative}\n**Last Modified:** ${doc.lastModified}\n\n---\n\n${doc.content}`
        }
      ]
    };
  }

  private async listDocs(filter?: string) {
    let docs = Array.from(this.documentIndex.entries());
    
    if (filter) {
      const filterLower = filter.toLowerCase();
      docs = docs.filter(([path, doc]) =>
        path.toLowerCase().includes(filterLower) ||
        doc.title.toLowerCase().includes(filterLower)
      );
    }

    const docList = docs
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([path, doc]) => `- **${doc.title}** → \`${path}\``)
      .join('\n');

    return {
      content: [
        {
          type: 'text',
          text: `# Documentation Files (${docs.length} total)\n\n${docList}`
        }
      ]
    };
  }

  private async getDocsSummary() {
    const categories = new Map<string, string[]>();
    
    for (const [path, doc] of this.documentIndex) {
      const dir = path.includes('/') ? path.split('/')[0] : 'root';
      if (!categories.has(dir)) categories.set(dir, []);
      categories.get(dir)!.push(doc.title);
    }

    const summary = Array.from(categories.entries())
      .map(([category, titles]) => 
        `## ${category}\n${titles.map(t => `- ${t}`).join('\n')}`
      )
      .join('\n\n');

    return {
      content: [
        {
          type: 'text',
          text: `# Documentation Summary\n\nTotal documents: ${this.documentIndex.size}\n\n${summary}`
        }
      ]
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Barbaro Documentation MCP Server running on stdio');
  }
}

const server = new DocumentationServer();
server.run().catch(console.error);