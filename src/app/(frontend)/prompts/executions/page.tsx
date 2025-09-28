import React, { Suspense } from 'react';
import Link from 'next/link';
import { PromptFilters } from '@/components/prompts/PromptFilters';
import { PromptExecution } from '@/types/prompts';

interface ExecutionsPageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    app?: string;
    stage?: string;
    feature?: string;
    projectId?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
  }>;
}

// Mock data - replace with actual PayloadCMS query
const mockExecutions: PromptExecution[] = [
  {
    id: 'exec-1',
    templateId: 'template-1',
    templateName: 'Character Development Prompt',
    app: 'character-service',
    stage: 'development',
    feature: 'character-creation',
    projectId: 'proj-123',
    tags: ['character', 'development'],
    model: 'claude-3-sonnet',
    inputs: {
      characterName: 'Sarah Connor',
      genre: 'sci-fi'
    },
    resolvedPrompt: 'Create a detailed character profile for Sarah Connor in the sci-fi genre...',
    status: 'completed',
    outputRaw: 'Character Profile for Sarah Connor: A determined woman...',
    executionTime: 3240,
    createdAt: '2024-01-20T10:30:00Z',
    updatedAt: '2024-01-20T10:30:45Z'
  },
  {
    id: 'exec-2',
    templateId: 'template-2',
    templateName: 'Story Structure Analysis',
    app: 'story-service',
    stage: 'concept',
    feature: 'story-analysis',
    projectId: 'proj-456',
    tags: ['story', 'analysis'],
    model: 'claude-3-opus',
    inputs: {
      storyContent: 'Once upon a time...'
    },
    resolvedPrompt: 'Analyze the story structure of Once upon a time...',
    status: 'failed',
    errorMessage: 'Model timeout after 30 seconds',
    createdAt: '2024-01-19T15:20:00Z',
    updatedAt: '2024-01-19T15:20:30Z'
  },
  {
    id: 'exec-3',
    templateName: 'Custom Prompt',
    app: 'auto-movie',
    stage: 'production',
    feature: 'custom',
    tags: ['custom'],
    model: 'claude-3-haiku',
    inputs: {},
    resolvedPrompt: 'Generate a movie trailer script for a horror movie...',
    status: 'running',
    createdAt: '2024-01-20T16:45:00Z',
    updatedAt: '2024-01-20T16:45:00Z'
  }
];

function getStatusIcon(status: string) {
  switch (status) {
    case 'completed':
      return '✅';
    case 'failed':
      return '❌';
    case 'running':
      return '⏳';
    case 'pending':
    default:
      return '⏸️';
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case 'completed':
      return 'bg-green-600';
    case 'failed':
      return 'bg-red-600';
    case 'running':
      return 'bg-yellow-600';
    case 'pending':
    default:
      return 'bg-slate-600';
  }
}

async function ExecutionsList({ searchParams }: { searchParams: ExecutionsPageProps['searchParams'] }) {
  // In a real implementation, this would query PayloadCMS
  const resolvedSearchParams = await searchParams;
  const query = new URLSearchParams(Object.entries(resolvedSearchParams || {}).filter(([_, v]) => v != null) as [string, string][])
  const res = await fetch(`/api/prompts?${query.toString()}`, { cache: 'no-store' })
  const data = await res.json()
  const executions: PromptExecution[] = data.executions || []

  if (executions.length === 0) {
    return (
      <div className="bg-slate-800 rounded-lg p-12 text-center">
        <div className="text-4xl mb-4">🚀</div>
        <h3 className="text-xl font-semibold text-white mb-2">No executions found</h3>
        <p className="text-slate-400 mb-4">Start testing prompts to see execution history here.</p>
        <Link
          href="/prompts/test"
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
        >
          Test a Prompt
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-lg overflow-hidden">
      {/* Table Header */}
      <div className="bg-slate-700 px-6 py-3 border-b border-slate-600">
        <div className="grid grid-cols-7 gap-4 text-sm font-medium text-slate-300">
          <div>Status</div>
          <div>Template</div>
          <div>Model</div>
          <div>Project</div>
          <div>App/Stage</div>
          <div>Created</div>
          <div>Actions</div>
        </div>
      </div>

      {/* Table Body */}
      <div className="divide-y divide-slate-700">
        {executions.map((execution) => (
          <Link
            key={execution.id}
            href={`/prompts/executions/${execution.id}`}
            className="block px-6 py-4 hover:bg-slate-750 transition-colors"
          >
            <div className="grid grid-cols-7 gap-4 items-center text-sm">
              {/* Status */}
              <div className="flex items-center space-x-2">
                <span className="text-lg">{getStatusIcon(execution.status)}</span>
                <span className={`px-2 py-1 text-xs font-medium text-white rounded ${getStatusColor(execution.status)}`}>
                  {execution.status}
                </span>
              </div>

              {/* Template */}
              <div>
                <p className="text-white font-medium truncate">
                  {execution.templateName || 'Custom Prompt'}
                </p>
                {execution.templateId && (
                  <p className="text-xs text-slate-400">ID: {execution.templateId}</p>
                )}
              </div>

              {/* Model */}
              <div>
                <span className="font-mono text-slate-300">{execution.model}</span>
                {execution.executionTime && (
                  <p className="text-xs text-slate-400">{Math.round(execution.executionTime)}ms</p>
                )}
              </div>

              {/* Project */}
              <div>
                {execution.projectId ? (
                  <span className="text-slate-300">{execution.projectId}</span>
                ) : (
                  <span className="text-slate-500">-</span>
                )}
              </div>

              {/* App/Stage */}
              <div className="space-y-1">
                <div className="flex items-center space-x-1">
                  <span className="px-2 py-0.5 text-xs bg-purple-600 text-white rounded">
                    {execution.app}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="px-2 py-0.5 text-xs bg-blue-600 text-white rounded">
                    {execution.stage}
                  </span>
                </div>
              </div>

              {/* Created */}
              <div>
                <p className="text-slate-300">
                  {new Date(execution.createdAt).toLocaleDateString()}
                </p>
                <p className="text-xs text-slate-400">
                  {new Date(execution.createdAt).toLocaleTimeString()}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    // Copy resolved prompt to clipboard
                    navigator.clipboard.writeText(execution.resolvedPrompt);
                  }}
                  className="p-1 text-slate-400 hover:text-white transition-colors"
                  title="Copy prompt"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
                {execution.templateId && (
                  <Link
                    href={`/prompts/test?templateId=${execution.templateId}&inputs=${encodeURIComponent(JSON.stringify(execution.inputs))}`}
                    onClick={(e) => e.stopPropagation()}
                    className="p-1 text-slate-400 hover:text-white transition-colors"
                    title="Rerun with same inputs"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </Link>
                )}
              </div>
            </div>

            {/* Tags */}
            {execution.tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {execution.tags.slice(0, 4).map((tag, index) => (
                  <span key={index} className="px-2 py-0.5 text-xs bg-slate-700 text-slate-300 rounded">
                    {tag}
                  </span>
                ))}
                {execution.tags.length > 4 && (
                  <span className="px-2 py-0.5 text-xs bg-slate-700 text-slate-400 rounded">
                    +{execution.tags.length - 4} more
                  </span>
                )}
              </div>
            )}

            {/* Error preview */}
            {execution.status === 'failed' && execution.errorMessage && (
              <div className="mt-2 text-xs text-red-400 bg-red-900/20 px-2 py-1 rounded">
                Error: {execution.errorMessage}
              </div>
            )}
          </Link>
        ))}
      </div>

      {/* Pagination placeholder */}
      <div className="bg-slate-700 px-6 py-3 border-t border-slate-600">
        <div className="flex items-center justify-between text-sm text-slate-400">
          <span>Showing {executions.length} executions</span>
          <div className="flex items-center space-x-2">
            <button className="px-3 py-1 bg-slate-600 hover:bg-slate-500 text-white rounded text-xs transition-colors">
              Previous
            </button>
            <span className="px-2">Page 1 of 1</span>
            <button className="px-3 py-1 bg-slate-600 hover:bg-slate-500 text-white rounded text-xs transition-colors">
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function ExecutionsPage({ searchParams }: ExecutionsPageProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Prompt Executions</h1>
          <p className="text-slate-400 mt-1">View and manage prompt execution history</p>
        </div>
        <div className="flex items-center space-x-3">
          <Link
            href="/prompts/templates"
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            View Templates
          </Link>
          <Link
            href="/prompts/test"
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Test
          </Link>
        </div>
      </div>

      {/* Filters */}
      <PromptFilters showExecutionFilters={true} />

      {/* Executions List */}
      <Suspense fallback={
        <div className="bg-slate-800 rounded-lg p-6 animate-pulse">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="grid grid-cols-7 gap-4">
                <div className="h-4 bg-slate-700 rounded"></div>
                <div className="h-4 bg-slate-700 rounded"></div>
                <div className="h-4 bg-slate-700 rounded"></div>
                <div className="h-4 bg-slate-700 rounded"></div>
                <div className="h-4 bg-slate-700 rounded"></div>
                <div className="h-4 bg-slate-700 rounded"></div>
                <div className="h-4 bg-slate-700 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      }>
        <ExecutionsList searchParams={searchParams} />
      </Suspense>
    </div>
  );
}