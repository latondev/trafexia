import express, { Express, Request, Response } from 'express';
import * as http from 'http';
import type { TrafficStorage } from './TrafficStorage';

export class McpServer {
  private app: Express;
  private server: http.Server | null = null;
  private trafficStorage: TrafficStorage;
  private port = 8890;
  private running = false;
  private sseConnections = new Map<string, Response>();

  constructor(trafficStorage: TrafficStorage) {
    this.trafficStorage = trafficStorage;
    this.app = express();
    this.setupRoutes();
  }

  private setupRoutes(): void {
    this.app.use(express.json());

    // CORS middleware
    this.app.use((_req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type');
      next();
    });

    // 1. SSE Connection establishment
    this.app.get('/sse', (req: Request, res: Response) => {
      const id = Math.random().toString(36).substring(2, 15);
      
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      });

      // Send the endpoint URL to post messages to
      const messageUrl = `/messages?id=${id}`;
      res.write(`event: endpoint\ndata: ${messageUrl}\n\n`);

      this.sseConnections.set(id, res);
      console.log(`[MCPServer] Client connected via SSE. ID: ${id}`);

      req.on('close', () => {
        this.sseConnections.delete(id);
        console.log(`[MCPServer] Client disconnected. ID: ${id}`);
      });
    });

    // 2. Client message posting
    this.app.post('/messages', async (req: Request, res: Response) => {
      const id = req.query.id as string;
      const clientSse = this.sseConnections.get(id);

      if (!clientSse) {
        res.status(404).send('SSE connection not found or closed');
        return;
      }

      const requestPayload = req.body;
      const responsePayload = await this.handleJsonRpc(requestPayload);

      // Write the response back to the client over the SSE stream
      clientSse.write(`event: message\ndata: ${JSON.stringify(responsePayload)}\n\n`);
      res.status(202).send('Accepted');
    });

    // Option: simple health check
    this.app.get('/health', (_req, res) => {
      res.json({ status: 'ok', mcp: true });
    });
  }

  private async handleJsonRpc(payload: any): Promise<any> {
    const { jsonrpc, id, method, params } = payload;
    if (jsonrpc !== '2.0') {
      return { jsonrpc: '2.0', id: id || null, error: { code: -32600, message: 'Invalid Request' } };
    }

    try {
      switch (method) {
        case 'initialize':
          return {
            jsonrpc: '2.0',
            id,
            result: {
              protocolVersion: '2024-11-05',
              capabilities: {
                tools: {}
              },
              serverInfo: {
                name: 'trafexia-mcp',
                version: '1.0.0'
              }
            }
          };

        case 'tools/list':
          return {
            jsonrpc: '2.0',
            id,
            result: {
              tools: [
                {
                  name: 'list_requests',
                  description: 'List captured HTTP/HTTPS requests from the database, sorted by timestamp descending.',
                  inputSchema: {
                    type: 'object',
                    properties: {
                      limit: { type: 'number', description: 'Maximum number of requests to return (default 50)' },
                      search: { type: 'string', description: 'Search query to filter by URL, host, or path' },
                      method: { type: 'string', description: 'HTTP method to filter by (e.g. GET, POST)' }
                    }
                  }
                },
                {
                  name: 'get_request_details',
                  description: 'Get detailed headers and body content of a specific request by its ID.',
                  inputSchema: {
                    type: 'object',
                    properties: {
                      id: { type: 'number', description: 'The request ID' }
                    },
                    required: ['id']
                  }
                },
                {
                  name: 'clear_requests',
                  description: 'Clear all captured HTTP/HTTPS requests from the database.',
                  inputSchema: {
                    type: 'object'
                  }
                }
              ]
            }
          };

        case 'tools/call': {
          const { name, arguments: args } = params;
          const result = await this.executeTool(name, args);
          return {
            jsonrpc: '2.0',
            id,
            result
          };
        }

        default:
          return {
            jsonrpc: '2.0',
            id,
            error: { code: -32601, message: `Method not found: ${method}` }
          };
      }
    } catch (err: any) {
      return {
        jsonrpc: '2.0',
        id,
        error: { code: -32603, message: err.message || 'Internal error' }
      };
    }
  }

  private async executeTool(name: string, args: any): Promise<any> {
    switch (name) {
      case 'list_requests': {
        const limit = args?.limit || 50;
        const searchQuery = args?.search || undefined;
        const methods = args?.method ? [args.method.toUpperCase()] : undefined;

        const requests = this.trafficStorage.getRequests({
          limit,
          searchQuery,
          methods
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(requests.map(r => ({
                id: r.id,
                timestamp: r.timestamp,
                method: r.method,
                url: r.url,
                host: r.host,
                path: r.path,
                status: r.status,
                size: r.size,
                duration: r.duration
              })), null, 2)
            }
          ]
        };
      }

      case 'get_request_details': {
        const id = args.id;
        const req = this.trafficStorage.getRequestById(id);
        if (!req) {
          throw new Error(`Request with ID ${id} not found`);
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(req, null, 2)
            }
          ]
        };
      }

      case 'clear_requests': {
        this.trafficStorage.clearAll();
        return {
          content: [
            {
              type: 'text',
              text: 'Successfully cleared all captured requests.'
            }
          ]
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }

  async start(): Promise<void> {
    if (this.running) return;

    return new Promise((resolve, reject) => {
      this.server = this.app.listen(this.port, '0.0.0.0', () => {
        this.running = true;
        console.log(`[MCPServer] Started and listening on port ${this.port}`);
        resolve();
      });

      this.server.on('error', (err) => {
        reject(err);
      });
    });
  }

  async stop(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.server || !this.running) {
        resolve();
        return;
      }

      this.server.close(() => {
        this.running = false;
        this.server = null;
        console.log('[MCPServer] Stopped');
        resolve();
      });
    });
  }
}
