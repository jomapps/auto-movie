/**
 * TypeScript Brain Client for WebSocket MCP Communication
 *
 * This client communicates with the brain service via WebSocket MCP protocol
 * for embeddings, document storage, and knowledge graph operations.
 */

import { WebSocket } from 'ws';

export interface EmbeddingRequest {
  text: string;
  model?: string;
  metadata?: Record<string, any>;
}

export interface EmbeddingResponse {
  embedding: number[];
  model: string;
  usage?: {
    prompt_tokens: number;
    total_tokens: number;
  };
}

export interface DocumentRequest {
  content: string;
  metadata?: Record<string, any>;
  collection?: string;
  id?: string;
}

export interface DocumentResponse {
  id: string;
  success: boolean;
  metadata?: Record<string, any>;
}

export interface SearchRequest {
  query: string;
  collection?: string;
  limit?: number;
  threshold?: number;
  metadata_filters?: Record<string, any>;
}

export interface SearchResult {
  id: string;
  content: string;
  score: number;
  metadata: Record<string, any>;
}

export interface KnowledgeGraphNode {
  id: string;
  type: string;
  label: string;
  properties: Record<string, any>;
  position?: { x: number; y: number };
}

export interface KnowledgeGraphEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  label: string;
  properties: Record<string, any>;
}

export interface KnowledgeGraphData {
  nodes: KnowledgeGraphNode[];
  edges: KnowledgeGraphEdge[];
}

export interface MCPRequest {
  id: string;
  method: string;
  params?: Record<string, any>;
}

export interface MCPResponse {
  id: string;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

export class BrainClient {
  private ws: WebSocket | null = null;
  private messageId = 0;
  private pendingRequests = new Map<string, {
    resolve: (value: any) => void;
    reject: (error: any) => void;
    timeout: NodeJS.Timeout;
  }>();
  private connectionPromise: Promise<void> | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 1000;

  constructor(
    private url: string = process.env.NEXT_PUBLIC_BRAIN_SERVICE_URL || 'wss://brain.ft.tc',
    private apiKey?: string
  ) {
    // Ensure WebSocket URL format
    if (!this.url.startsWith('ws://') && !this.url.startsWith('wss://')) {
      this.url = this.url.replace(/^http/, 'ws');
    }
  }

  /**
   * Connect to the brain service via WebSocket
   */
  async connect(): Promise<void> {
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = new Promise((resolve, reject) => {
      try {
        // Add headers if API key is provided
        const headers: Record<string, string> = {};
        if (this.apiKey) {
          headers['Authorization'] = `Bearer ${this.apiKey}`;
        }

        this.ws = new WebSocket(`${this.url}/mcp`, { headers });

        this.ws.onopen = () => {
          console.log('Connected to brain service');
          this.reconnectAttempts = 0;
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const response: MCPResponse = JSON.parse(event.data.toString());
            this.handleMessage(response);
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };

        this.ws.onclose = (event) => {
          console.log('Disconnected from brain service:', event.code, event.reason);
          this.connectionPromise = null;

          // Reject all pending requests
          this.pendingRequests.forEach(({ reject }) => {
            reject(new Error('Connection closed'));
          });
          this.pendingRequests.clear();

          // Attempt reconnection
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            setTimeout(() => {
              console.log(`Reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
              this.connect().catch(console.error);
            }, this.reconnectInterval * this.reconnectAttempts);
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        };

        // Timeout for initial connection
        setTimeout(() => {
          if (this.ws?.readyState !== WebSocket.OPEN) {
            reject(new Error('Connection timeout'));
          }
        }, 10000);

      } catch (error) {
        reject(error);
      }
    });

    return this.connectionPromise;
  }

  /**
   * Disconnect from the brain service
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.connectionPromise = null;
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(response: MCPResponse): void {
    const pending = this.pendingRequests.get(response.id);
    if (!pending) {
      console.warn('Received response for unknown request:', response.id);
      return;
    }

    clearTimeout(pending.timeout);
    this.pendingRequests.delete(response.id);

    if (response.error) {
      pending.reject(new Error(`MCP Error ${response.error.code}: ${response.error.message}`));
    } else {
      pending.resolve(response.result);
    }
  }

  /**
   * Send MCP request and wait for response
   */
  private async sendRequest(method: string, params?: Record<string, any>, timeoutMs = 30000): Promise<any> {
    await this.connect();

    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected');
    }

    const id = (++this.messageId).toString();
    const request: MCPRequest = { id, method, params };

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new Error(`Request timeout after ${timeoutMs}ms`));
      }, timeoutMs);

      this.pendingRequests.set(id, { resolve, reject, timeout });

      try {
        this.ws!.send(JSON.stringify(request));
      } catch (error) {
        clearTimeout(timeout);
        this.pendingRequests.delete(id);
        reject(error);
      }
    });
  }

  /**
   * Generate embeddings for text
   */
  async createEmbedding(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    const result = await this.sendRequest('embeddings.create', {
      text: request.text,
      model: request.model || 'jina-embeddings-v2-base-en',
      metadata: request.metadata
    });

    return {
      embedding: result.embedding,
      model: result.model,
      usage: result.usage
    };
  }

  /**
   * Store a document in the vector database
   */
  async storeDocument(request: DocumentRequest): Promise<DocumentResponse> {
    const result = await this.sendRequest('documents.store', {
      content: request.content,
      metadata: request.metadata,
      collection: request.collection || 'default',
      id: request.id
    });

    return {
      id: result.id,
      success: result.success,
      metadata: result.metadata
    };
  }

  /**
   * Search for similar documents
   */
  async searchDocuments(request: SearchRequest): Promise<SearchResult[]> {
    const result = await this.sendRequest('documents.search', {
      query: request.query,
      collection: request.collection || 'default',
      limit: request.limit || 10,
      threshold: request.threshold || 0.7,
      metadata_filters: request.metadata_filters
    });

    return result.results || [];
  }

  /**
   * Get knowledge graph data
   */
  async getKnowledgeGraph(query?: string, limit = 100): Promise<KnowledgeGraphData> {
    const result = await this.sendRequest('knowledge_graph.get', {
      query,
      limit
    });

    return {
      nodes: result.nodes || [],
      edges: result.edges || []
    };
  }

  /**
   * Add a node to the knowledge graph
   */
  async addKnowledgeGraphNode(node: Omit<KnowledgeGraphNode, 'id'>): Promise<string> {
    const result = await this.sendRequest('knowledge_graph.add_node', node);
    return result.id;
  }

  /**
   * Add an edge to the knowledge graph
   */
  async addKnowledgeGraphEdge(edge: Omit<KnowledgeGraphEdge, 'id'>): Promise<string> {
    const result = await this.sendRequest('knowledge_graph.add_edge', edge);
    return result.id;
  }

  /**
   * Query the knowledge graph with natural language
   */
  async queryKnowledgeGraph(query: string): Promise<{
    answer: string;
    sources: SearchResult[];
    graph_data?: KnowledgeGraphData;
  }> {
    const result = await this.sendRequest('knowledge_graph.query', { query });
    return result;
  }

  /**
   * Get collections in the vector database
   */
  async getCollections(): Promise<string[]> {
    const result = await this.sendRequest('collections.list');
    return result.collections || [];
  }

  /**
   * Create a new collection
   */
  async createCollection(name: string, metadata?: Record<string, any>): Promise<boolean> {
    const result = await this.sendRequest('collections.create', { name, metadata });
    return result.success;
  }

  /**
   * Delete a collection
   */
  async deleteCollection(name: string): Promise<boolean> {
    const result = await this.sendRequest('collections.delete', { name });
    return result.success;
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: string; version?: string }> {
    try {
      const result = await this.sendRequest('health.check', {}, 5000);
      return result;
    } catch (error) {
      return { status: 'error' };
    }
  }
}

// Singleton instance for the app
let brainClientInstance: BrainClient | null = null;

/**
 * Get the singleton brain client instance
 */
export function getBrainClient(): BrainClient {
  if (!brainClientInstance) {
    brainClientInstance = new BrainClient(
      process.env.NEXT_PUBLIC_BRAIN_SERVICE_URL,
      process.env.BRAIN_SERVICE_API_KEY
    );
  }
  return brainClientInstance;
}

/**
 * React hook for using the brain client
 */
export function useBrainClient() {
  return getBrainClient();
}