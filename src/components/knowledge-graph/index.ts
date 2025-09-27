/**
 * Knowledge Graph Components
 *
 * This module provides React components for visualizing and interacting with
 * knowledge graphs from the brain service.
 */

export { KnowledgeGraphViewer } from './KnowledgeGraphViewer';
export { GraphNode, AnimatedGraphNode, ClusterNode } from './GraphNode';
export { GraphEdge, CurvedGraphEdge, BundledGraphEdges } from './GraphEdge';

// Re-export types from brain client for convenience
export type {
  KnowledgeGraphData,
  KnowledgeGraphNode,
  KnowledgeGraphEdge,
  SearchResult
} from '@/lib/brain-client';