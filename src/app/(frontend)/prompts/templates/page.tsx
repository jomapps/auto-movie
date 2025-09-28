import React, { Suspense } from 'react';
import Link from 'next/link';
import { PromptCard } from '@/components/prompts/PromptCard';
import { PromptFilters } from '@/components/prompts/PromptFilters';
import { PromptTemplate } from '@/types/prompts';

interface TemplatesPageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    app?: string;
    stage?: string;
    feature?: string;
    tag?: string;
    model?: string;
  }>;
}

// Mock data - replace with actual PayloadCMS query
const mockTemplates: PromptTemplate[] = [
  {
    id: '1',
    name: 'Character Development Prompt',
    app: 'character-service',
    stage: 'development',
    feature: 'character-creation',
    tags: ['character', 'development', 'personality'],
    model: 'claude-3-sonnet',
    template: 'Create a detailed character profile for {{characterName}} in the {{genre}} genre. Consider their background, motivations, and character arc.',
    variableDefs: [
      { name: 'characterName', type: 'string', required: true, description: 'Name of the character' },
      { name: 'genre', type: 'string', required: true, options: ['drama', 'comedy', 'action', 'horror'] }
    ],
    notes: 'Used for generating detailed character profiles',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-20T14:30:00Z',
    version: 1
  },
  {
    id: '2',
    name: 'Story Structure Analysis',
    app: 'story-service',
    stage: 'concept',
    feature: 'story-analysis',
    tags: ['story', 'structure', 'analysis'],
    model: 'claude-3-opus',
    template: 'Analyze the story structure of {{storyContent}} and provide feedback on pacing, character development, and plot consistency.',
    variableDefs: [
      { name: 'storyContent', type: 'string', required: true, description: 'The story content to analyze' }
    ],
    createdAt: '2024-01-10T09:00:00Z',
    updatedAt: '2024-01-18T16:45:00Z',
    version: 2
  }
];

async function TemplatesList({ searchParams }: { searchParams: TemplatesPageProps['searchParams'] }) {
  // In a real implementation, this would query PayloadCMS
  const resolvedSearchParams = await searchParams;
  const templates = mockTemplates; // Replace with actual filtering logic

  if (templates.length === 0) {
    return (
      <div className="bg-slate-800 rounded-lg p-12 text-center">
        <div className="text-4xl mb-4">📝</div>
        <h3 className="text-xl font-semibold text-white mb-2">No templates found</h3>
        <p className="text-slate-400 mb-4">Create your first prompt template to get started.</p>
        <Link
          href="/prompts/templates/new"
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
        >
          Create Template
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {templates.map((template) => (
        <PromptCard
          key={template.id}
          template={template}
          onTest={(id) => window.open(`/prompts/test?templateId=${id}`, '_blank')}
          onEdit={(id) => window.open(`/prompts/templates/${id}/edit`, '_blank')}
          onDuplicate={(id) => console.log('Duplicate template:', id)}
          onDelete={(id) => console.log('Delete template:', id)}
        />
      ))}
    </div>
  );
}

export default async function TemplatesPage({ searchParams }: TemplatesPageProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Prompt Templates</h1>
          <p className="text-slate-400 mt-1">Manage and organize your prompt templates</p>
        </div>
        <div className="flex items-center space-x-3">
          <Link
            href="/prompts/test"
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014.846 17H9.1a3.374 3.374 0 00-1.249-.547l-.548-.547z" />
            </svg>
            Test Prompt
          </Link>
          <Link
            href="/prompts/templates/new"
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Template
          </Link>
        </div>
      </div>

      {/* Filters */}
      <PromptFilters />

      {/* Templates List */}
      <Suspense fallback={
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-slate-800 rounded-lg p-6 animate-pulse">
              <div className="h-4 bg-slate-700 rounded w-3/4 mb-4"></div>
              <div className="h-3 bg-slate-700 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-slate-700 rounded w-2/3 mb-4"></div>
              <div className="space-y-2">
                <div className="h-2 bg-slate-700 rounded"></div>
                <div className="h-2 bg-slate-700 rounded"></div>
                <div className="h-2 bg-slate-700 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      }>
        <TemplatesList searchParams={searchParams} />
      </Suspense>
    </div>
  );
}