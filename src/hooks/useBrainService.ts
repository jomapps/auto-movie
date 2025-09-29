'use client';

import { useState, useEffect, useCallback } from 'react';
import { getBrainClient, KnowledgeGraphData, SearchResult, DocumentResponse } from '@/lib/brain-client';

/**
 * React hook for brain service operations
 */
export function useBrainService() {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const brainClient = getBrainClient();

  // Check connection status
  const checkConnection = useCallback(async () => {
    setIsConnecting(true);
    setError(null);

    try {
      const health = await brainClient.healthCheck();
      setIsConnected(health.status === 'ok');
      return health.status === 'ok';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed');
      setIsConnected(false);
      return false;
    } finally {
      setIsConnecting(false);
    }
  }, [brainClient]);

  // Auto-check connection on mount
  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  return {
    isConnected,
    isConnecting,
    error,
    checkConnection,
    brainClient
  };
}

/**
 * Hook for knowledge graph operations
 */
export function useKnowledgeGraph(query?: string) {
  const [data, setData] = useState<KnowledgeGraphData>({ nodes: [], edges: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const brainClient = getBrainClient();

  const loadGraph = useCallback(async (searchQuery?: string) => {
    setLoading(true);
    setError(null);

    try {
      const graphData = await brainClient.getKnowledgeGraph(searchQuery, 100);
      setData(graphData);
      return graphData;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load knowledge graph';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [brainClient]);

  const addNode = useCallback(async (node: {
    type: string;
    label: string;
    properties?: Record<string, any>;
  }) => {
    try {
      const nodeId = await brainClient.addKnowledgeGraphNode({
        ...node,
        properties: node.properties || {}
      });
      // Reload graph to show new node
      await loadGraph(query);
      return nodeId;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add node');
      throw err;
    }
  }, [brainClient, loadGraph, query]);

  const addEdge = useCallback(async (edge: {
    source: string;
    target: string;
    type: string;
    label: string;
    properties?: Record<string, any>;
  }) => {
    try {
      // Ensure properties is always defined for the API call
      const edgeWithProperties = {
        ...edge,
        properties: edge.properties || {}
      };
      const edgeId = await brainClient.addKnowledgeGraphEdge(edgeWithProperties);
      // Reload graph to show new edge
      await loadGraph(query);
      return edgeId;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add edge');
      throw err;
    }
  }, [brainClient, loadGraph, query]);

  // Load initial data
  useEffect(() => {
    loadGraph(query);
  }, [loadGraph, query]);

  return {
    data,
    loading,
    error,
    loadGraph,
    addNode,
    addEdge
  };
}

/**
 * Hook for document search operations
 */
export function useDocumentSearch() {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const brainClient = getBrainClient();

  const search = useCallback(async (
    query: string,
    options?: {
      collection?: string;
      limit?: number;
      threshold?: number;
      metadata_filters?: Record<string, any>;
    }
  ) => {
    if (!query.trim()) {
      setResults([]);
      return [];
    }

    setLoading(true);
    setError(null);

    try {
      const searchResults = await brainClient.searchDocuments({
        query,
        collection: options?.collection || 'default',
        limit: options?.limit || 10,
        threshold: options?.threshold || 0.7,
        metadata_filters: options?.metadata_filters
      });

      setResults(searchResults);
      return searchResults;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Search failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [brainClient]);

  const storeDocument = useCallback(async (
    content: string,
    metadata?: Record<string, any>,
    collection?: string
  ) => {
    try {
      const response = await brainClient.storeDocument({
        content,
        metadata,
        collection: collection || 'default'
      });
      return response;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to store document');
      throw err;
    }
  }, [brainClient]);

  return {
    results,
    loading,
    error,
    search,
    storeDocument
  };
}

/**
 * Hook for embedding operations
 */
export function useEmbeddings() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const brainClient = getBrainClient();

  const createEmbedding = useCallback(async (
    text: string,
    model?: string,
    metadata?: Record<string, any>
  ) => {
    setLoading(true);
    setError(null);

    try {
      const embedding = await brainClient.createEmbedding({
        text,
        model: model || 'jina-embeddings-v2-base-en',
        metadata
      });

      return embedding;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create embedding';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [brainClient]);

  return {
    loading,
    error,
    createEmbedding
  };
}

/**
 * Hook for natural language queries to the knowledge graph
 */
export function useKnowledgeGraphQuery() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const brainClient = getBrainClient();

  const query = useCallback(async (question: string) => {
    setLoading(true);
    setError(null);

    try {
      const result = await brainClient.queryKnowledgeGraph(question);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Query failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [brainClient]);

  return {
    loading,
    error,
    query
  };
}