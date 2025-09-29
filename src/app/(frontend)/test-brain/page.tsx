'use client';

import React, { useState, useEffect } from 'react';
import { KnowledgeGraphViewer } from '@/components/knowledge-graph';
import { getBrainClient, KnowledgeGraphNode, KnowledgeGraphEdge } from '@/lib/brain-client';

/**
 * Test page for Brain Service integration and Knowledge Graph visualization
 */
export default function TestBrainPage() {
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [selectedNode, setSelectedNode] = useState<KnowledgeGraphNode | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<KnowledgeGraphEdge | null>(null);
  const [testResults, setTestResults] = useState<string[]>([]);

  const brainClient = getBrainClient();

  // Test brain service connection
  const testConnection = async () => {
    setConnectionStatus('connecting');
    const results: string[] = [];

    try {
      // Test health check
      results.push('🔍 Testing brain service connection...');
      const health = await brainClient.healthCheck();
      results.push(`✅ Health check: ${health.status}`);

      // Test basic functionality with sample data
      results.push('📝 Testing document storage...');
      const sampleDoc = await brainClient.storeDocument({
        content: 'This is a test document about movie production and cinematography.',
        metadata: { type: 'test', category: 'movie' },
        collection: 'test'
      });
      results.push(`✅ Document stored: ${sampleDoc.id}`);

      // Test embedding creation
      results.push('🧠 Testing embedding creation...');
      const embedding = await brainClient.createEmbedding({
        text: 'Science fiction movie about space exploration',
        metadata: { type: 'test' }
      });
      results.push(`✅ Embedding created: ${embedding.embedding.length} dimensions`);

      // Test document search
      results.push('🔍 Testing document search...');
      const searchResults = await brainClient.searchDocuments({
        query: 'movie production',
        collection: 'test',
        limit: 5
      });
      results.push(`✅ Found ${searchResults.length} similar documents`);

      // Test knowledge graph
      results.push('🕸️ Testing knowledge graph...');
      const graphData = await brainClient.getKnowledgeGraph('movie', 50);
      results.push(`✅ Knowledge graph: ${graphData.nodes.length} nodes, ${graphData.edges.length} edges`);

      setConnectionStatus('connected');
      results.push('🎉 All tests passed!');
    } catch (error) {
      setConnectionStatus('error');
      results.push(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    setTestResults(results);
  };

  // Add sample knowledge graph data
  const addSampleData = async () => {
    try {
      const results: string[] = [...testResults];
      results.push('📊 Adding sample knowledge graph data...');

      // Add sample nodes
      const characterNode = await brainClient.addKnowledgeGraphNode({
        type: 'person',
        label: 'John Director',
        properties: {
          role: 'director',
          experience: 'veteran',
          specialty: 'sci-fi',
          description: 'Acclaimed science fiction film director'
        }
      });

      const movieNode = await brainClient.addKnowledgeGraphNode({
        type: 'product',
        label: 'Space Odyssey 2024',
        properties: {
          genre: 'science fiction',
          budget: '50M',
          status: 'in production',
          description: 'Epic space exploration movie'
        }
      });

      const studioNode = await brainClient.addKnowledgeGraphNode({
        type: 'organization',
        label: 'Stellar Studios',
        properties: {
          type: 'production company',
          founded: '2015',
          specializes: 'blockbuster films',
          description: 'Major Hollywood production studio'
        }
      });

      // Add sample edges
      const directorEdge = await brainClient.addKnowledgeGraphEdge({
        source: characterNode,
        target: movieNode,
        type: 'directs',
        label: 'directs',
        properties: {
          role: 'primary director',
          contract_start: '2024-01-01'
        }
      });

      const productionEdge = await brainClient.addKnowledgeGraphEdge({
        source: studioNode,
        target: movieNode,
        type: 'produces',
        label: 'produces',
        properties: {
          investment: '50M',
          rights: 'worldwide'
        }
      });

      const worksForEdge = await brainClient.addKnowledgeGraphEdge({
        source: characterNode,
        target: studioNode,
        type: 'works_for',
        label: 'works for',
        properties: {
          contract_type: 'project-based',
          relationship: 'contracted director'
        }
      });

      results.push(`✅ Added 3 nodes and 3 edges to knowledge graph`);
      results.push(`📝 Director: ${characterNode}`);
      results.push(`🎬 Movie: ${movieNode}`);
      results.push(`🏢 Studio: ${studioNode}`);

      setTestResults(results);
    } catch (error) {
      const results = [...testResults];
      results.push(`❌ Error adding sample data: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setTestResults(results);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Brain Service Integration Test
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Test the TypeScript brain client connection and knowledge graph visualization
          </p>
        </div>

        {/* Connection Status and Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Connection Status */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Connection Status</h2>
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-3 h-3 rounded-full ${
                connectionStatus === 'connected' ? 'bg-green-500' :
                connectionStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' :
                connectionStatus === 'error' ? 'bg-red-500' :
                'bg-gray-400'
              }`} />
              <span className="capitalize">{connectionStatus}</span>
            </div>
            <div className="space-y-2">
              <button
                onClick={testConnection}
                disabled={connectionStatus === 'connecting'}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700
                         disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {connectionStatus === 'connecting' ? 'Testing...' : 'Test Connection'}
              </button>
              <button
                onClick={addSampleData}
                disabled={connectionStatus !== 'connected'}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700
                         disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Add Sample Data
              </button>
            </div>
          </div>

          {/* Test Results */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Test Results</h2>
            <div className="bg-gray-100 dark:bg-gray-700 rounded-md p-4 max-h-64 overflow-y-auto">
              {testResults.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400">Click &quot;Test Connection&quot; to start testing...</p>
              ) : (
                <div className="space-y-1 font-mono text-sm">
                  {testResults.map((result, index) => (
                    <div key={index} className="whitespace-pre-wrap">
                      {result}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Knowledge Graph Viewer */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold">Knowledge Graph Visualization</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Interactive visualization of the knowledge graph from the brain service
            </p>
          </div>

          <div className="p-6">
            <KnowledgeGraphViewer
              height={600}
              showControls={true}
              onNodeClick={(node) => {
                setSelectedNode(node);
                setSelectedEdge(null);
              }}
              onEdgeClick={(edge) => {
                setSelectedEdge(edge);
                setSelectedNode(null);
              }}
            />
          </div>
        </div>

        {/* Selection Details */}
        {(selectedNode || selectedEdge) && (
          <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Selection Details</h2>

            {selectedNode && (
              <div>
                <h3 className="text-lg font-medium text-blue-600 dark:text-blue-400 mb-2">
                  Node: {selectedNode.label}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p><strong>Type:</strong> {selectedNode.type}</p>
                    <p><strong>ID:</strong> {selectedNode.id}</p>
                  </div>
                  <div>
                    <p><strong>Properties:</strong></p>
                    <pre className="text-sm bg-gray-100 dark:bg-gray-700 p-2 rounded mt-1">
                      {JSON.stringify(selectedNode.properties, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            )}

            {selectedEdge && (
              <div>
                <h3 className="text-lg font-medium text-green-600 dark:text-green-400 mb-2">
                  Edge: {selectedEdge.label}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p><strong>Type:</strong> {selectedEdge.type}</p>
                    <p><strong>Source:</strong> {selectedEdge.source}</p>
                    <p><strong>Target:</strong> {selectedEdge.target}</p>
                  </div>
                  <div>
                    <p><strong>Properties:</strong></p>
                    <pre className="text-sm bg-gray-100 dark:bg-gray-700 p-2 rounded mt-1">
                      {JSON.stringify(selectedEdge.properties, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* API Usage Examples */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">API Usage Examples</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Create Embedding</h3>
              <pre className="text-sm bg-gray-100 dark:bg-gray-700 p-3 rounded overflow-x-auto">
{`const embedding = await brainClient.createEmbedding({
  text: 'Science fiction movie about space exploration',
  metadata: { type: 'movie-description' }
});`}
              </pre>
            </div>

            <div>
              <h3 className="font-medium mb-2">Store Document</h3>
              <pre className="text-sm bg-gray-100 dark:bg-gray-700 p-3 rounded overflow-x-auto">
{`const document = await brainClient.storeDocument({
  content: 'Movie script content...',
  metadata: { type: 'script', genre: 'sci-fi' },
  collection: 'scripts'
});`}
              </pre>
            </div>

            <div>
              <h3 className="font-medium mb-2">Search Documents</h3>
              <pre className="text-sm bg-gray-100 dark:bg-gray-700 p-3 rounded overflow-x-auto">
{`const results = await brainClient.searchDocuments({
  query: 'space exploration themes',
  collection: 'scripts',
  limit: 10,
  threshold: 0.7
});`}
              </pre>
            </div>

            <div>
              <h3 className="font-medium mb-2">Query Knowledge Graph</h3>
              <pre className="text-sm bg-gray-100 dark:bg-gray-700 p-3 rounded overflow-x-auto">
{`const answer = await brainClient.queryKnowledgeGraph(
  'Who are the directors working on sci-fi movies?'
);`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}