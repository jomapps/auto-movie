'use client';

import React, { useMemo } from 'react';
import { KnowledgeGraphEdge, KnowledgeGraphNode } from '@/lib/brain-client';

interface GraphEdgeProps {
  edge: KnowledgeGraphEdge;
  sourceNode?: KnowledgeGraphNode & { x: number; y: number };
  targetNode?: KnowledgeGraphNode & { x: number; y: number };
  isSelected?: boolean;
  showLabel?: boolean;
  onClick?: () => void;
}

// Color mapping for different edge types
const edgeTypeColors: Record<string, string> = {
  'knows': '#3B82F6',          // Blue
  'works_for': '#10B981',      // Green
  'located_in': '#F59E0B',     // Amber
  'related_to': '#8B5CF6',     // Purple
  'part_of': '#EF4444',        // Red
  'created_by': '#6B7280',     // Gray
  'influences': '#EC4899',     // Pink
  'depends_on': '#06B6D4',     // Cyan
  'similar_to': '#84CC16',     // Lime
  'contains': '#F97316',       // Orange
  'default': '#6B7280'         // Default gray
};

// Stroke style mapping for different edge types
const edgeTypeStyles: Record<string, { strokeDasharray?: string; strokeWidth: number }> = {
  'knows': { strokeWidth: 2 },
  'works_for': { strokeWidth: 3 },
  'located_in': { strokeWidth: 2 },
  'related_to': { strokeDasharray: '5,5', strokeWidth: 2 },
  'part_of': { strokeWidth: 3 },
  'created_by': { strokeDasharray: '3,3', strokeWidth: 2 },
  'influences': { strokeDasharray: '8,4', strokeWidth: 2 },
  'depends_on': { strokeDasharray: '10,2', strokeWidth: 2 },
  'similar_to': { strokeDasharray: '2,2', strokeWidth: 1 },
  'contains': { strokeWidth: 2 },
  'default': { strokeWidth: 1 }
};

export function GraphEdge({
  edge,
  sourceNode,
  targetNode,
  isSelected = false,
  showLabel = true,
  onClick
}: GraphEdgeProps) {
  // Calculate edge geometry
  const edgeGeometry = useMemo(() => {
    if (!sourceNode || !targetNode) {
      return null;
    }

    const dx = targetNode.x - sourceNode.x;
    const dy = targetNode.y - sourceNode.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance === 0) return null;

    // Calculate arrow position (offset from target node edge)
    const targetRadius = 12; // Approximate node radius
    const arrowOffset = targetRadius + 5;
    const ratio = (distance - arrowOffset) / distance;

    const arrowX = sourceNode.x + dx * ratio;
    const arrowY = sourceNode.y + dy * ratio;

    // Calculate label position (middle of edge)
    const labelX = (sourceNode.x + targetNode.x) / 2;
    const labelY = (sourceNode.y + targetNode.y) / 2;

    // Calculate arrow direction
    const angle = Math.atan2(dy, dx);

    return {
      sourceX: sourceNode.x,
      sourceY: sourceNode.y,
      targetX: arrowX,
      targetY: arrowY,
      labelX,
      labelY,
      angle,
      distance
    };
  }, [sourceNode, targetNode]);

  // Memoize edge appearance
  const edgeAppearance = useMemo(() => {
    const baseColor = edgeTypeColors[edge.type] || edgeTypeColors.default;
    const style = edgeTypeStyles[edge.type] || edgeTypeStyles.default;

    // Adjust opacity based on confidence or weight
    const confidence = edge.properties?.confidence || edge.properties?.weight || 1;
    const opacity = Math.max(0.3, Math.min(1, confidence));

    return {
      color: baseColor,
      opacity,
      strokeWidth: isSelected ? style.strokeWidth + 1 : style.strokeWidth,
      strokeDasharray: style.strokeDasharray,
      glow: isSelected
    };
  }, [edge.type, edge.properties, isSelected]);

  // Memoize label properties
  const labelProps = useMemo(() => {
    const maxLabelLength = 15;
    const truncatedLabel = edge.label.length > maxLabelLength
      ? `${edge.label.substring(0, maxLabelLength)}...`
      : edge.label;

    return {
      text: truncatedLabel,
      fontSize: 10,
      padding: 4
    };
  }, [edge.label]);

  if (!edgeGeometry) return null;

  return (
    <g
      className="graph-edge cursor-pointer transition-all duration-200 hover:opacity-80"
      onClick={onClick}
    >
      {/* Edge line */}
      <line
        x1={edgeGeometry.sourceX}
        y1={edgeGeometry.sourceY}
        x2={edgeGeometry.targetX}
        y2={edgeGeometry.targetY}
        stroke={edgeAppearance.color}
        strokeWidth={edgeAppearance.strokeWidth}
        strokeOpacity={edgeAppearance.opacity}
        strokeDasharray={edgeAppearance.strokeDasharray}
        fill="none"
        className="transition-all duration-200"
      />

      {/* Selection indicator */}
      {isSelected && (
        <line
          x1={edgeGeometry.sourceX}
          y1={edgeGeometry.sourceY}
          x2={edgeGeometry.targetX}
          y2={edgeGeometry.targetY}
          stroke="#1D4ED8"
          strokeWidth={edgeAppearance.strokeWidth + 2}
          strokeOpacity={0.3}
          fill="none"
          className="animate-pulse"
        />
      )}

      {/* Arrow head */}
      <ArrowHead
        x={edgeGeometry.targetX}
        y={edgeGeometry.targetY}
        angle={edgeGeometry.angle}
        color={edgeAppearance.color}
        opacity={edgeAppearance.opacity}
        size={edgeAppearance.strokeWidth + 2}
      />

      {/* Edge label */}
      {showLabel && edgeGeometry.distance > 50 && (
        <g className="edge-label">
          {/* Label background */}
          <rect
            x={edgeGeometry.labelX - labelProps.text.length * 2.5}
            y={edgeGeometry.labelY - 8}
            width={labelProps.text.length * 5}
            height={16}
            fill="rgba(255, 255, 255, 0.9)"
            stroke="rgba(0, 0, 0, 0.1)"
            strokeWidth="1"
            rx="2"
            pointerEvents="none"
          />

          {/* Label text */}
          <text
            x={edgeGeometry.labelX}
            y={edgeGeometry.labelY}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={labelProps.fontSize}
            fill="#374151"
            fontWeight="500"
            pointerEvents="none"
          >
            {labelProps.text}
          </text>
        </g>
      )}

      {/* Invisible wider line for easier clicking */}
      <line
        x1={edgeGeometry.sourceX}
        y1={edgeGeometry.sourceY}
        x2={edgeGeometry.targetX}
        y2={edgeGeometry.targetY}
        stroke="transparent"
        strokeWidth={Math.max(8, edgeAppearance.strokeWidth + 4)}
        fill="none"
        pointerEvents="all"
      />

      {/* Tooltip */}
      <title>
        {`${edge.label} (${edge.type})`}
        {edge.properties?.description && ` - ${edge.properties.description}`}
        {edge.properties?.weight && ` | Weight: ${edge.properties.weight}`}
      </title>
    </g>
  );
}

/**
 * Arrow head component for directed edges
 */
function ArrowHead({
  x,
  y,
  angle,
  color,
  opacity = 1,
  size = 4
}: {
  x: number;
  y: number;
  angle: number;
  color: string;
  opacity?: number;
  size?: number;
}) {
  const arrowLength = size * 2;
  const arrowWidth = size;

  // Calculate arrow points
  const points = [
    { x: 0, y: 0 }, // Tip
    { x: -arrowLength, y: -arrowWidth },
    { x: -arrowLength * 0.7, y: 0 },
    { x: -arrowLength, y: arrowWidth }
  ];

  // Transform points based on angle
  const transformedPoints = points.map(point => ({
    x: x + point.x * Math.cos(angle) - point.y * Math.sin(angle),
    y: y + point.x * Math.sin(angle) + point.y * Math.cos(angle)
  }));

  const pathData = `M ${transformedPoints[0].x} ${transformedPoints[0].y}
                   L ${transformedPoints[1].x} ${transformedPoints[1].y}
                   L ${transformedPoints[2].x} ${transformedPoints[2].y}
                   L ${transformedPoints[3].x} ${transformedPoints[3].y} Z`;

  return (
    <path
      d={pathData}
      fill={color}
      fillOpacity={opacity}
      stroke="none"
    />
  );
}

/**
 * Curved edge component for better visualization when nodes are close
 */
export function CurvedGraphEdge(props: GraphEdgeProps) {
  const { edge, sourceNode, targetNode, isSelected = false, showLabel = true, onClick } = props;

  const curvedPath = useMemo(() => {
    if (!sourceNode || !targetNode) return null;

    const dx = targetNode.x - sourceNode.x;
    const dy = targetNode.y - sourceNode.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < 50) {
      // Use curved path for close nodes
      const midX = (sourceNode.x + targetNode.x) / 2;
      const midY = (sourceNode.y + targetNode.y) / 2;

      // Calculate control points for smooth curve
      const controlOffset = distance * 0.3;
      const perpX = -dy / distance * controlOffset;
      const perpY = dx / distance * controlOffset;

      const controlX = midX + perpX;
      const controlY = midY + perpY;

      return `M ${sourceNode.x} ${sourceNode.y} Q ${controlX} ${controlY} ${targetNode.x} ${targetNode.y}`;
    }

    return null;
  }, [sourceNode, targetNode]);

  if (curvedPath) {
    return (
      <g className="curved-edge cursor-pointer" onClick={onClick}>
        <path
          d={curvedPath}
          fill="none"
          stroke={edgeTypeColors[edge.type] || edgeTypeColors.default}
          strokeWidth={isSelected ? 3 : 2}
          strokeOpacity={0.7}
        />
        {showLabel && (
          <text
            x={(sourceNode!.x + targetNode!.x) / 2}
            y={(sourceNode!.y + targetNode!.y) / 2 - 10}
            textAnchor="middle"
            fontSize="10"
            fill="#374151"
          >
            {edge.label}
          </text>
        )}
      </g>
    );
  }

  // Fall back to straight edge
  return <GraphEdge {...props} />;
}

/**
 * Bundled edges component for multiple edges between same nodes
 */
export function BundledGraphEdges({
  edges,
  sourceNode,
  targetNode,
  selectedEdgeId,
  onEdgeClick
}: {
  edges: KnowledgeGraphEdge[];
  sourceNode?: KnowledgeGraphNode & { x: number; y: number };
  targetNode?: KnowledgeGraphNode & { x: number; y: number };
  selectedEdgeId?: string;
  onEdgeClick?: (edge: KnowledgeGraphEdge) => void;
}) {
  if (edges.length <= 1) {
    return edges.map(edge => (
      <GraphEdge
        key={edge.id}
        edge={edge}
        sourceNode={sourceNode}
        targetNode={targetNode}
        isSelected={selectedEdgeId === edge.id}
        onClick={() => onEdgeClick?.(edge)}
      />
    ));
  }

  // Bundle multiple edges with slight offsets
  return (
    <g className="bundled-edges">
      {edges.map((edge, index) => {
        const offset = (index - (edges.length - 1) / 2) * 3;

        if (!sourceNode || !targetNode) return null;

        // Calculate perpendicular offset
        const dx = targetNode.x - sourceNode.x;
        const dy = targetNode.y - sourceNode.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance === 0) return null;

        const perpX = -dy / distance * offset;
        const perpY = dx / distance * offset;

        const offsetSourceNode = {
          ...sourceNode,
          x: sourceNode.x + perpX,
          y: sourceNode.y + perpY
        };

        const offsetTargetNode = {
          ...targetNode,
          x: targetNode.x + perpX,
          y: targetNode.y + perpY
        };

        return (
          <GraphEdge
            key={edge.id}
            edge={edge}
            sourceNode={offsetSourceNode}
            targetNode={offsetTargetNode}
            isSelected={selectedEdgeId === edge.id}
            showLabel={index === 0} // Only show label for first edge to avoid clutter
            onClick={() => onEdgeClick?.(edge)}
          />
        );
      })}
    </g>
  );
}