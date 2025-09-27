'use client';

import React, { useMemo } from 'react';
import { KnowledgeGraphNode } from '@/lib/brain-client';

interface GraphNodeProps {
  node: KnowledgeGraphNode & { x: number; y: number };
  isSelected?: boolean;
  showLabel?: boolean;
  onClick?: () => void;
  onDoubleClick?: () => void;
}

// Color mapping for different node types
const nodeTypeColors: Record<string, string> = {
  person: '#3B82F6',      // Blue
  organization: '#10B981', // Green
  location: '#F59E0B',     // Amber
  concept: '#8B5CF6',      // Purple
  event: '#EF4444',        // Red
  document: '#6B7280',     // Gray
  product: '#EC4899',      // Pink
  technology: '#06B6D4',   // Cyan
  default: '#374151'       // Default gray
};

// Size mapping for different node types
const nodeTypeSizes: Record<string, number> = {
  person: 12,
  organization: 14,
  location: 10,
  concept: 8,
  event: 10,
  document: 8,
  product: 10,
  technology: 12,
  default: 10
};

export function GraphNode({
  node,
  isSelected = false,
  showLabel = true,
  onClick,
  onDoubleClick
}: GraphNodeProps) {
  // Memoize node appearance based on type and properties
  const nodeAppearance = useMemo(() => {
    const baseColor = nodeTypeColors[node.type] || nodeTypeColors.default;
    const baseSize = nodeTypeSizes[node.type] || nodeTypeSizes.default;

    // Adjust size based on node importance (if available in properties)
    const importance = node.properties?.importance || 1;
    const size = baseSize * Math.max(0.5, Math.min(2, importance));

    // Adjust opacity based on confidence (if available)
    const confidence = node.properties?.confidence || 1;
    const opacity = Math.max(0.3, Math.min(1, confidence));

    return {
      color: baseColor,
      size,
      opacity,
      strokeWidth: isSelected ? 3 : 1,
      strokeColor: isSelected ? '#1D4ED8' : '#ffffff'
    };
  }, [node.type, node.properties, isSelected]);

  // Memoize label properties
  const labelProps = useMemo(() => {
    const maxLabelLength = 20;
    const truncatedLabel = node.label.length > maxLabelLength
      ? `${node.label.substring(0, maxLabelLength)}...`
      : node.label;

    return {
      text: truncatedLabel,
      fontSize: Math.max(10, Math.min(14, nodeAppearance.size * 0.8)),
      offsetY: nodeAppearance.size + 15
    };
  }, [node.label, nodeAppearance.size]);

  return (
    <g
      className="graph-node cursor-pointer transition-all duration-200 hover:opacity-80"
      transform={`translate(${node.x}, ${node.y})`}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
    >
      {/* Node circle */}
      <circle
        r={nodeAppearance.size}
        fill={nodeAppearance.color}
        fillOpacity={nodeAppearance.opacity}
        stroke={nodeAppearance.strokeColor}
        strokeWidth={nodeAppearance.strokeWidth}
        className="transition-all duration-200"
      />

      {/* Selection indicator */}
      {isSelected && (
        <circle
          r={nodeAppearance.size + 4}
          fill="none"
          stroke="#1D4ED8"
          strokeWidth="2"
          strokeDasharray="4,2"
          className="animate-pulse"
        />
      )}

      {/* Node icon or text indicator based on type */}
      <text
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={nodeAppearance.size * 0.6}
        fill="white"
        fontWeight="bold"
        pointerEvents="none"
      >
        {getNodeIcon(node.type)}
      </text>

      {/* Node label */}
      {showLabel && (
        <g className="node-label">
          {/* Label background */}
          <rect
            x={-labelProps.text.length * 3}
            y={labelProps.offsetY - 8}
            width={labelProps.text.length * 6}
            height={16}
            fill="rgba(255, 255, 255, 0.9)"
            stroke="rgba(0, 0, 0, 0.1)"
            strokeWidth="1"
            rx="2"
            pointerEvents="none"
          />

          {/* Label text */}
          <text
            textAnchor="middle"
            y={labelProps.offsetY}
            fontSize={labelProps.fontSize}
            fill="#374151"
            fontWeight="500"
            pointerEvents="none"
          >
            {labelProps.text}
          </text>
        </g>
      )}

      {/* Hover effect */}
      <circle
        r={nodeAppearance.size + 2}
        fill="transparent"
        className="hover:fill-black hover:fill-opacity-10"
        pointerEvents="all"
      />

      {/* Tooltip area - for future tooltip implementation */}
      <title>
        {`${node.label} (${node.type})`}
        {node.properties?.description && ` - ${node.properties.description}`}
      </title>
    </g>
  );
}

/**
 * Get an icon character or symbol for different node types
 */
function getNodeIcon(nodeType: string): string {
  const icons: Record<string, string> = {
    person: '👤',
    organization: '🏢',
    location: '📍',
    concept: '💭',
    event: '📅',
    document: '📄',
    product: '📦',
    technology: '⚙️',
    default: '●'
  };

  return icons[nodeType] || icons.default;
}

/**
 * GraphNode component with animation support
 */
export function AnimatedGraphNode(props: GraphNodeProps) {
  return (
    <g className="animated-node">
      <defs>
        <filter id={`glow-${props.node.id}`}>
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      <GraphNode
        {...props}
        // Add glow effect for selected nodes
        style={{
          filter: props.isSelected ? `url(#glow-${props.node.id})` : undefined
        }}
      />
    </g>
  );
}

/**
 * Cluster node for grouped visualization
 */
export function ClusterNode({
  cluster,
  nodes,
  isExpanded = false,
  onToggle,
  ...props
}: {
  cluster: { id: string; label: string; type: string; x: number; y: number };
  nodes: KnowledgeGraphNode[];
  isExpanded?: boolean;
  onToggle?: () => void;
} & Omit<GraphNodeProps, 'node'>) {
  const clusterSize = Math.max(20, Math.min(40, nodes.length * 2));

  return (
    <g
      className="cluster-node cursor-pointer"
      transform={`translate(${cluster.x}, ${cluster.y})`}
      onClick={onToggle}
    >
      {/* Cluster background */}
      <circle
        r={clusterSize}
        fill="rgba(59, 130, 246, 0.1)"
        stroke="#3B82F6"
        strokeWidth="2"
        strokeDasharray={isExpanded ? "none" : "5,5"}
      />

      {/* Cluster label */}
      <text
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="12"
        fill="#3B82F6"
        fontWeight="bold"
      >
        {cluster.label}
      </text>

      {/* Node count indicator */}
      <text
        textAnchor="middle"
        y={clusterSize + 15}
        fontSize="10"
        fill="#6B7280"
      >
        {nodes.length} nodes
      </text>

      {/* Expand/collapse indicator */}
      <text
        textAnchor="middle"
        y={-clusterSize - 5}
        fontSize="12"
        fill="#3B82F6"
      >
        {isExpanded ? '−' : '+'}
      </text>
    </g>
  );
}