# Brain Client Implementation - Phase 3 Documentation

## Overview

This document describes the TypeScript brain client implementation for the auto-movie app, including WebSocket MCP communication, knowledge graph visualization, and React integration.

## Architecture

### Components

1. **Brain Client** (`src/lib/brain-client.ts`)
   - WebSocket MCP protocol implementation
   - Document storage and search
   - Embedding generation
   - Knowledge graph operations
   - Singleton pattern for app-wide usage

2. **Knowledge Graph Components** (`src/components/knowledge-graph/`)
   - `KnowledgeGraphViewer`: Main visualization component
   - `GraphNode`: Individual node rendering with type-specific styling
   - `GraphEdge`: Edge rendering with directional arrows and labels

3. **React Hooks** (`src/hooks/useBrainService.ts`)
   - `useBrainService`: Connection management
   - `useKnowledgeGraph`: Graph data operations
   - `useDocumentSearch`: Document search functionality
   - `useEmbeddings`: Embedding operations
   - `useKnowledgeGraphQuery`: Natural language queries

4. **Test Page** (`src/app/(frontend)/test-brain/page.tsx`)
   - Connection testing
   - Sample data creation
   - Interactive knowledge graph demonstration

## Files Created/Modified

### New Files
- `/src/lib/brain-client.ts` - Core brain service client
- `/src/components/knowledge-graph/KnowledgeGraphViewer.tsx` - Main graph component
- `/src/components/knowledge-graph/GraphNode.tsx` - Node visualization
- `/src/components/knowledge-graph/GraphEdge.tsx` - Edge visualization
- `/src/components/knowledge-graph/index.ts` - Component exports
- `/src/hooks/useBrainService.ts` - React hooks for brain service
- `/src/app/(frontend)/test-brain/page.tsx` - Test and demo page
- `/docs/brain-client-implementation.md` - This documentation

### Modified Files
- `.env.example` - Updated brain service URL to `https://brain.ft.tc`
- `next.config.mjs` - Added WebSocket support and CORS headers

## Configuration

### Environment Variables
```bash
# Production brain service URL
NEXT_PUBLIC_BRAIN_SERVICE_URL=https://brain.ft.tc

# Optional API key for authenticated requests
BRAIN_SERVICE_API_KEY=your-brain-service-api-key
```

### WebSocket Configuration
The client automatically converts HTTP URLs to WebSocket URLs and connects to the `/mcp` endpoint:
- `https://brain.ft.tc` → `wss://brain.ft.tc/mcp`
- `http://localhost:8002` → `ws://localhost:8002/mcp`

## Usage Examples

### Basic Brain Client Usage
```typescript
import { getBrainClient } from '@/lib/brain-client';

const brainClient = getBrainClient();

// Test connection
const health = await brainClient.healthCheck();

// Store a document
const doc = await brainClient.storeDocument({
  content: 'Movie script content...',
  metadata: { type: 'script', genre: 'sci-fi' },
  collection: 'scripts'
});

// Search documents
const results = await brainClient.searchDocuments({
  query: 'space exploration themes',
  collection: 'scripts',
  limit: 10
});

// Create embeddings
const embedding = await brainClient.createEmbedding({
  text: 'Science fiction movie about space exploration'
});
```

### React Hook Usage
```typescript
import { useBrainService, useKnowledgeGraph } from '@/hooks/useBrainService';

function MyComponent() {
  const { isConnected, error } = useBrainService();
  const { data, loading, addNode } = useKnowledgeGraph();

  const handleAddNode = async () => {
    await addNode({
      type: 'person',
      label: 'Director Name',
      properties: { role: 'director', experience: 'veteran' }
    });
  };

  if (!isConnected) return <div>Connecting to brain service...</div>;
  if (error) return <div>Error: {error}</div>;

  return <div>Connected! {data.nodes.length} nodes loaded</div>;
}
```

### Knowledge Graph Visualization
```typescript
import { KnowledgeGraphViewer } from '@/components/knowledge-graph';

function GraphView() {
  return (
    <KnowledgeGraphViewer
      height={600}
      showControls={true}
      onNodeClick={(node) => console.log('Selected node:', node)}
      onEdgeClick={(edge) => console.log('Selected edge:', edge)}
    />
  );
}
```

## Features

### Brain Client Features
- ✅ WebSocket MCP protocol communication
- ✅ Automatic reconnection with exponential backoff
- ✅ Request timeout handling
- ✅ Document storage and retrieval
- ✅ Vector similarity search
- ✅ Embedding generation
- ✅ Knowledge graph operations
- ✅ Collection management
- ✅ Health monitoring

### Knowledge Graph Features
- ✅ Interactive node and edge visualization
- ✅ Type-based node coloring and sizing
- ✅ Zoom and pan controls
- ✅ Search and filtering
- ✅ Real-time data updates
- ✅ Node and edge selection
- ✅ Responsive design
- ✅ Dark mode support

### Node Types
- **Person** (👤) - Blue - Directors, actors, crew
- **Organization** (🏢) - Green - Studios, production companies
- **Location** (📍) - Amber - Filming locations, settings
- **Concept** (💭) - Purple - Themes, genres, ideas
- **Event** (📅) - Red - Premieres, festivals, milestones
- **Document** (📄) - Gray - Scripts, contracts, notes
- **Product** (📦) - Pink - Movies, shows, episodes
- **Technology** (⚙️) - Cyan - Equipment, software, techniques

### Edge Types
- **knows** - Personal relationships
- **works_for** - Employment relationships
- **located_in** - Geographic relationships
- **related_to** - General associations
- **part_of** - Hierarchical relationships
- **created_by** - Creation relationships
- **influences** - Influence relationships
- **depends_on** - Dependency relationships

## Testing

### Access Test Page
Visit `/test-brain` in the application to:
1. Test brain service connection
2. Add sample knowledge graph data
3. Visualize the interactive knowledge graph
4. View API usage examples
5. Test document storage and search

### Sample Test Scenarios
1. **Connection Test**: Verify WebSocket MCP connection
2. **Document Operations**: Store and search movie-related documents
3. **Embedding Generation**: Create text embeddings
4. **Knowledge Graph**: Add nodes/edges and visualize relationships
5. **Search Functionality**: Test similarity search with various thresholds

## Error Handling

The implementation includes comprehensive error handling:
- Connection failures with automatic retry
- Request timeouts (configurable)
- Invalid response handling
- WebSocket disconnection recovery
- User-friendly error messages

## Performance Considerations

- WebSocket connection pooling
- Request deduplication
- Efficient graph rendering with SVG
- Memoized component rendering
- Lazy loading of graph data
- Configurable request timeouts

## Security

- CORS headers configured in Next.js
- Optional API key authentication
- Secure WebSocket connections (WSS)
- Input validation and sanitization
- No sensitive data in client-side code

## Future Enhancements

- Graph layout algorithms (force-directed, hierarchical)
- Real-time collaborative editing
- Graph export/import functionality
- Advanced filtering and search
- Performance metrics dashboard
- Integration with other services

## Troubleshooting

### Common Issues

1. **Connection Fails**
   - Check if brain service is running at the configured URL
   - Verify CORS settings allow WebSocket connections
   - Check browser developer tools for WebSocket errors

2. **Graph Not Rendering**
   - Ensure sample data has been added
   - Check browser console for JavaScript errors
   - Verify SVG rendering in browser

3. **Slow Performance**
   - Reduce number of nodes/edges in view
   - Enable filtering to show subset of data
   - Check network latency to brain service

### Debug Mode
Enable debug logging by setting `localStorage.debug = 'brain-client'` in browser console.

## Dependencies

### Required Dependencies
- `ws` - WebSocket client library
- `@types/ws` - TypeScript definitions for ws

### Optional Dependencies (for enhanced visualization)
- `reactflow` - Alternative graph visualization library
- `d3` - Advanced data visualization (if needed)

## Conclusion

The brain client implementation provides a robust foundation for integrating the auto-movie app with the brain service's knowledge graph and document storage capabilities. The modular architecture allows for easy extension and customization while maintaining performance and reliability.