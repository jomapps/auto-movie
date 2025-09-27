'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, Filter, ZoomIn, ZoomOut, RotateCcw, Settings } from 'lucide-react';
import { KnowledgeGraphData, KnowledgeGraphNode, KnowledgeGraphEdge, getBrainClient } from '@/lib/brain-client';
import { GraphNode } from './GraphNode';
import { GraphEdge } from './GraphEdge';

interface KnowledgeGraphViewerProps {
  query?: string;
  height?: number;
  showControls?: boolean;
  onNodeClick?: (node: KnowledgeGraphNode) => void;
  onEdgeClick?: (edge: KnowledgeGraphEdge) => void;
}

interface ViewBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface SimulationNode extends KnowledgeGraphNode {
  x: number;
  y: number;
  vx?: number;
  vy?: number;
  fx?: number;
  fy?: number;
}

interface FilterState {
  nodeTypes: string[];
  edgeTypes: string[];
  showLabels: boolean;
  minConnections: number;
}

export function KnowledgeGraphViewer({
  query,
  height = 600,
  showControls = true,
  onNodeClick,
  onEdgeClick
}: KnowledgeGraphViewerProps) {
  const [graphData, setGraphData] = useState<KnowledgeGraphData>({ nodes: [], edges: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(query || '');
  const [viewBox, setViewBox] = useState<ViewBox>({ x: 0, y: 0, width: 800, height: 600 });
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [simulationNodes, setSimulationNodes] = useState<SimulationNode[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    nodeTypes: [],
    edgeTypes: [],
    showLabels: true,
    minConnections: 0
  });

  const brainClient = getBrainClient();

  // Memoize available node and edge types
  const availableNodeTypes = useMemo(() => {
    const types = new Set<string>();
    graphData.nodes.forEach(node => types.add(node.type));
    return Array.from(types);
  }, [graphData.nodes]);

  const availableEdgeTypes = useMemo(() => {
    const types = new Set<string>();
    graphData.edges.forEach(edge => types.add(edge.type));
    return Array.from(types);
  }, [graphData.edges]);

  // Filter graph data based on current filters
  const filteredGraphData = useMemo(() => {
    let filteredNodes = graphData.nodes;
    let filteredEdges = graphData.edges;

    // Filter by node types
    if (filters.nodeTypes.length > 0) {
      filteredNodes = filteredNodes.filter(node =>
        filters.nodeTypes.includes(node.type)
      );
    }

    // Filter by edge types
    if (filters.edgeTypes.length > 0) {
      filteredEdges = filteredEdges.filter(edge =>
        filters.edgeTypes.includes(edge.type)
      );
    }

    // Filter by minimum connections
    if (filters.minConnections > 0) {
      const nodeConnections = new Map<string, number>();
      filteredEdges.forEach(edge => {
        nodeConnections.set(edge.source, (nodeConnections.get(edge.source) || 0) + 1);
        nodeConnections.set(edge.target, (nodeConnections.get(edge.target) || 0) + 1);
      });

      filteredNodes = filteredNodes.filter(node =>
        (nodeConnections.get(node.id) || 0) >= filters.minConnections
      );
    }

    // Only include edges where both source and target nodes are still present
    const nodeIds = new Set(filteredNodes.map(node => node.id));
    filteredEdges = filteredEdges.filter(edge =>
      nodeIds.has(edge.source) && nodeIds.has(edge.target)
    );

    return { nodes: filteredNodes, edges: filteredEdges };
  }, [graphData, filters]);

  // Load knowledge graph data
  const loadGraphData = useCallback(async (searchTerm?: string) => {
    setLoading(true);
    setError(null);

    try {
      const data = await brainClient.getKnowledgeGraph(searchTerm, 100);
      setGraphData(data);

      // Initialize simulation nodes with positions
      const nodes: SimulationNode[] = data.nodes.map((node, index) => ({
        ...node,
        x: node.position?.x ?? Math.random() * 400 + 200,
        y: node.position?.y ?? Math.random() * 400 + 200,
      }));

      setSimulationNodes(nodes);

      // Auto-fit view to content
      if (nodes.length > 0) {
        const padding = 50;
        const xs = nodes.map(n => n.x);
        const ys = nodes.map(n => n.y);
        const minX = Math.min(...xs) - padding;
        const maxX = Math.max(...xs) + padding;
        const minY = Math.min(...ys) - padding;
        const maxY = Math.max(...ys) + padding;

        setViewBox({
          x: minX,
          y: minY,
          width: maxX - minX,
          height: maxY - minY
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load knowledge graph');
    } finally {
      setLoading(false);
    }
  }, [brainClient]);

  // Load data on mount and when query changes
  useEffect(() => {
    loadGraphData(searchQuery);
  }, [loadGraphData, searchQuery]);

  // Handle search
  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    loadGraphData(searchQuery);
  }, [loadGraphData, searchQuery]);

  // Handle node click
  const handleNodeClick = useCallback((node: KnowledgeGraphNode) => {
    setSelectedNode(selectedNode === node.id ? null : node.id);
    setSelectedEdge(null);
    onNodeClick?.(node);
  }, [selectedNode, onNodeClick]);

  // Handle edge click
  const handleEdgeClick = useCallback((edge: KnowledgeGraphEdge) => {
    setSelectedEdge(selectedEdge === edge.id ? null : edge.id);
    setSelectedNode(null);
    onEdgeClick?.(edge);
  }, [selectedEdge, onEdgeClick]);

  // Handle mouse events for panning
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;

    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;

    setViewBox(prev => ({
      ...prev,
      x: prev.x - dx * (prev.width / 800),
      y: prev.y - dy * (prev.height / 600)
    }));

    setDragStart({ x: e.clientX, y: e.clientY });
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Zoom controls
  const zoomIn = useCallback(() => {
    setViewBox(prev => ({
      x: prev.x + prev.width * 0.1,
      y: prev.y + prev.height * 0.1,
      width: prev.width * 0.8,
      height: prev.height * 0.8
    }));
  }, []);

  const zoomOut = useCallback(() => {
    setViewBox(prev => ({
      x: prev.x - prev.width * 0.125,
      y: prev.y - prev.height * 0.125,
      width: prev.width * 1.25,
      height: prev.height * 1.25
    }));
  }, []);

  const resetView = useCallback(() => {
    setViewBox({ x: 0, y: 0, width: 800, height: 600 });
  }, []);

  // Toggle filter selection
  const toggleFilter = useCallback((type: 'nodeTypes' | 'edgeTypes', value: string) => {
    setFilters(prev => ({
      ...prev,
      [type]: prev[type].includes(value)
        ? prev[type].filter(item => item !== value)
        : [...prev[type], value]
    }));
  }, []);

  return (
    <div className="w-full border rounded-lg bg-white dark:bg-gray-900">
      {/* Controls */}
      {showControls && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-[300px]">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search knowledge graph..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md
                           bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                           focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700
                         disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Loading...' : 'Search'}
              </button>
            </form>

            {/* Zoom and filter controls */}
            <div className="flex gap-2">
              <button
                onClick={zoomIn}
                className="p-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={zoomOut}
                className="p-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={resetView}
                className="p-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                title="Reset View"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2 border rounded-md transition-colors ${
                  showFilters
                    ? 'bg-blue-100 dark:bg-blue-900 border-blue-300 dark:border-blue-600'
                    : 'border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
                title="Filters"
              >
                <Filter className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Node Types Filter */}
                <div>
                  <h4 className="font-medium mb-2">Node Types</h4>
                  <div className="space-y-1">
                    {availableNodeTypes.map(type => (
                      <label key={type} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={filters.nodeTypes.includes(type)}
                          onChange={() => toggleFilter('nodeTypes', type)}
                          className="mr-2"
                        />
                        <span className="text-sm">{type}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Edge Types Filter */}
                <div>
                  <h4 className="font-medium mb-2">Edge Types</h4>
                  <div className="space-y-1">
                    {availableEdgeTypes.map(type => (
                      <label key={type} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={filters.edgeTypes.includes(type)}
                          onChange={() => toggleFilter('edgeTypes', type)}
                          className="mr-2"
                        />
                        <span className="text-sm">{type}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Other Filters */}
                <div>
                  <h4 className="font-medium mb-2">Display Options</h4>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.showLabels}
                        onChange={(e) => setFilters(prev => ({ ...prev, showLabels: e.target.checked }))}
                        className="mr-2"
                      />
                      <span className="text-sm">Show Labels</span>
                    </label>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Min Connections: {filters.minConnections}
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="10"
                        value={filters.minConnections}
                        onChange={(e) => setFilters(prev => ({ ...prev, minConnections: parseInt(e.target.value) }))}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Graph Area */}
      <div className="relative" style={{ height }}>
        {error && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <p className="text-red-600 dark:text-red-400 mb-2">Error loading knowledge graph:</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{error}</p>
              <button
                onClick={() => loadGraphData(searchQuery)}
                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-gray-900/50">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Loading knowledge graph...</p>
            </div>
          </div>
        )}

        {!loading && !error && (
          <svg
            width="100%"
            height="100%"
            viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
            className="cursor-grab active:cursor-grabbing"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {/* Edges */}
            <g className="edges">
              {filteredGraphData.edges.map(edge => (
                <GraphEdge
                  key={edge.id}
                  edge={edge}
                  sourceNode={simulationNodes.find(n => n.id === edge.source)}
                  targetNode={simulationNodes.find(n => n.id === edge.target)}
                  isSelected={selectedEdge === edge.id}
                  showLabel={filters.showLabels}
                  onClick={() => handleEdgeClick(edge)}
                />
              ))}
            </g>

            {/* Nodes */}
            <g className="nodes">
              {filteredGraphData.nodes.map(node => {
                const simNode = simulationNodes.find(n => n.id === node.id);
                if (!simNode) return null;

                return (
                  <GraphNode
                    key={node.id}
                    node={simNode}
                    isSelected={selectedNode === node.id}
                    showLabel={filters.showLabels}
                    onClick={() => handleNodeClick(node)}
                  />
                );
              })}
            </g>
          </svg>
        )}
      </div>

      {/* Status Bar */}
      <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400">
        {filteredGraphData.nodes.length} nodes, {filteredGraphData.edges.length} edges
        {filteredGraphData.nodes.length !== graphData.nodes.length && (
          <span className="ml-2 text-blue-600 dark:text-blue-400">
            (filtered from {graphData.nodes.length} nodes, {graphData.edges.length} edges)
          </span>
        )}
      </div>
    </div>
  );
}