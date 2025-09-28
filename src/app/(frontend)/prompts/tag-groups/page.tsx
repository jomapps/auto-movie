import React, { Suspense } from 'react';
import Link from 'next/link';
import { PromptTemplate } from '@/types/prompts';
import { extractTagGroups, TagGroup } from '@/lib/prompts/tag-utils';

interface TagGroupsPageProps {
  searchParams: Promise<{
    projectId?: string;
  }>;
}

// Mock data - replace with actual PayloadCMS query
const mockTemplates: PromptTemplate[] = [
  {
    id: '1',
    name: 'Main Reference Setup',
    app: 'auto-movie',
    stage: 'concept',
    feature: 'reference-creation',
    tags: ['mainReference-001', 'reference', 'setup'],
    model: 'claude-3-sonnet',
    template: 'Create the main reference document for {{projectName}} with genre {{genre}}.',
    variableDefs: [
      { name: 'projectName', type: 'string', required: true, description: 'Name of the project' },
      { name: 'genre', type: 'string', required: true, options: ['drama', 'comedy', 'action', 'horror'] }
    ],
    notes: 'First step in the main reference workflow',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-20T14:30:00Z',
    version: 1
  },
  {
    id: '2',
    name: 'Character Development',
    app: 'auto-movie',
    stage: 'development',
    feature: 'character-creation',
    tags: ['mainReference-002', 'character', 'development'],
    model: 'claude-3-sonnet',
    template: 'Develop main characters for {{projectName}} based on the reference: {{mainReference}}.',
    variableDefs: [
      { name: 'projectName', type: 'string', required: true, description: 'Name of the project' },
      { name: 'mainReference', type: 'string', required: true, description: 'Main reference document' }
    ],
    notes: 'Second step - builds on main reference',
    createdAt: '2024-01-15T11:00:00Z',
    updatedAt: '2024-01-20T15:30:00Z',
    version: 1
  },
  {
    id: '3',
    name: 'Story Structure',
    app: 'auto-movie',
    stage: 'development',
    feature: 'story-structure',
    tags: ['mainReference-003', 'story', 'structure'],
    model: 'claude-3-opus',
    template: 'Create story structure for {{projectName}} with characters: {{characters}}.',
    variableDefs: [
      { name: 'projectName', type: 'string', required: true, description: 'Name of the project' },
      { name: 'characters', type: 'string', required: true, description: 'Character descriptions' }
    ],
    notes: 'Third step - creates story structure',
    createdAt: '2024-01-15T12:00:00Z',
    updatedAt: '2024-01-20T16:30:00Z',
    version: 1
  },
  {
    id: '4',
    name: 'Scene Planning Setup',
    app: 'auto-movie',
    stage: 'production',
    feature: 'scene-planning',
    tags: ['scenePlanning-001', 'scene', 'planning'],
    model: 'claude-3-sonnet',
    template: 'Plan scenes for {{projectName}} based on story structure {{storyStructure}}.',
    variableDefs: [
      { name: 'projectName', type: 'string', required: true, description: 'Name of the project' },
      { name: 'storyStructure', type: 'string', required: true, description: 'Story structure document' }
    ],
    notes: 'First step in scene planning workflow',
    createdAt: '2024-01-16T10:00:00Z',
    updatedAt: '2024-01-21T14:30:00Z',
    version: 1
  },
  {
    id: '5',
    name: 'Scene Details',
    app: 'auto-movie',
    stage: 'production',
    feature: 'scene-details',
    tags: ['scenePlanning-002', 'scene', 'details'],
    model: 'claude-3-opus',
    template: 'Create detailed scene descriptions for {{projectName}} using plan: {{scenePlan}}.',
    variableDefs: [
      { name: 'projectName', type: 'string', required: true, description: 'Name of the project' },
      { name: 'scenePlan', type: 'string', required: true, description: 'Scene planning document' }
    ],
    notes: 'Second step - detailed scene creation',
    createdAt: '2024-01-16T11:00:00Z',
    updatedAt: '2024-01-21T15:30:00Z',
    version: 1
  }
];

interface TagGroupCardProps {
  group: TagGroup;
  projectId?: string;
}

function TagGroupCard({ group, projectId }: TagGroupCardProps) {
  const runUrl = projectId 
    ? `/prompts/tag-groups/${group.name}/run?projectId=${projectId}`
    : `/prompts/tag-groups/${group.name}/run`;
  
  return (
    <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 hover:border-slate-600 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white mb-1">
            {group.name}
          </h3>
          <p className="text-sm text-slate-400">
            Sequential workflow with {group.count} templates
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="px-2 py-1 text-xs font-medium bg-purple-600 text-white rounded">
            {group.count} steps
          </span>
        </div>
      </div>
      
      {/* Template Preview */}
      <div className="space-y-2 mb-4">
        <h4 className="text-sm font-medium text-slate-300">Templates in order:</h4>
        <div className="space-y-1">
          {group.templates.slice(0, 3).map((template, index) => (
            <div key={template.id} className="flex items-center space-x-2 text-sm">
              <span className="w-5 h-5 bg-slate-700 rounded-full flex items-center justify-center text-xs text-slate-400">
                {index + 1}
              </span>
              <span className="text-slate-300">{template.name}</span>
              <span className="px-2 py-0.5 text-xs bg-slate-700 text-slate-400 rounded">
                {template.feature}
              </span>
            </div>
          ))}
          {group.templates.length > 3 && (
            <div className="flex items-center space-x-2 text-sm text-slate-400">
              <span className="w-5 h-5"></span>
              <span>+{group.templates.length - 3} more templates...</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <div className="text-lg font-semibold text-white">{group.templates.length}</div>
          <div className="text-xs text-slate-400">Templates</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-blue-400">
            {group.templates.reduce((sum, t) => sum + t.variableDefs.length, 0)}
          </div>
          <div className="text-xs text-slate-400">Variables</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-green-400">
            {new Set(group.templates.map(t => t.app)).size}
          </div>
          <div className="text-xs text-slate-400">Services</div>
        </div>
      </div>
      
      {/* Apps Used */}
      <div className="mb-4">
        <div className="flex flex-wrap gap-1">
          {[...new Set(group.templates.map(t => t.app))].map(app => (
            <span key={app} className="px-2 py-1 text-xs bg-slate-700 text-slate-300 rounded">
              {app}
            </span>
          ))}
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <Link
          href={`/prompts/tag-groups/${group.name}`}
          className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
        >
          View Details
        </Link>
        
        <Link
          href={runUrl}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition-colors flex items-center space-x-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h1m4 0h1m6-10V6a2 2 0 00-2-2H9a2 2 0 00-2 2v1M4 9h1v12a2 2 0 002 2h10a2 2 0 002-2V9h1" />
          </svg>
          <span>Run Workflow</span>
        </Link>
      </div>
    </div>
  );
}

async function TagGroupsList({ searchParams }: { searchParams: TagGroupsPageProps['searchParams'] }) {
  // In a real implementation, this would query PayloadCMS
  const resolvedSearchParams = await searchParams;
  const templates = mockTemplates; // Replace with actual template fetching
  
  const tagGroups = extractTagGroups(templates);
  
  if (tagGroups.length === 0) {
    return (
      <div className="bg-slate-800 rounded-lg p-12 text-center">
        <div className="text-4xl mb-4">🏷️</div>
        <h3 className="text-xl font-semibold text-white mb-2">No Tag Groups Found</h3>
        <p className="text-slate-400 mb-4">
          Tag groups are created automatically when templates have tags in the format &quot;prefix-number&quot; (e.g., mainReference-001).
        </p>
        <Link
          href="/prompts/templates"
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
        >
          View Templates
        </Link>
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {tagGroups.map((group) => (
        <TagGroupCard
          key={group.name}
          group={group}
          projectId={resolvedSearchParams.projectId}
        />
      ))}
    </div>
  );
}

export default async function TagGroupsPage({ searchParams }: TagGroupsPageProps) {
  const resolvedSearchParams = await searchParams;
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Tag Groups</h1>
          <p className="text-slate-400 mt-1">
            Execute sequential workflows of related prompt templates
          </p>
          {resolvedSearchParams.projectId && (
            <div className="mt-2">
              <span className="px-3 py-1 text-sm bg-blue-600 text-white rounded-full">
                Project: {resolvedSearchParams.projectId}
              </span>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-3">
          <Link
            href="/prompts/templates"
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-slate-300 bg-slate-700 border border-slate-600 rounded-md hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            View Templates
          </Link>
          
          <Link
            href="/prompts/executions"
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-slate-300 bg-slate-700 border border-slate-600 rounded-md hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            View Executions
          </Link>
        </div>
      </div>
      
      {/* Info Box */}
      <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <svg className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 className="text-sm font-medium text-blue-400 mb-1">About Tag Groups</h3>
            <p className="text-sm text-blue-200">
              Tag groups are automatically created from templates that share a common tag prefix (e.g., &quot;mainReference-001&quot;, &quot;mainReference-002&quot;). 
              These workflows execute templates sequentially, allowing outputs from one step to be used as inputs in the next.
            </p>
          </div>
        </div>
      </div>
      
      {/* Tag Groups List */}
      <Suspense fallback={
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-slate-800 rounded-lg p-6 animate-pulse">
              <div className="flex items-center justify-between mb-4">
                <div className="h-5 bg-slate-700 rounded w-32"></div>
                <div className="h-6 bg-slate-700 rounded w-16"></div>
              </div>
              <div className="space-y-2 mb-4">
                <div className="h-3 bg-slate-700 rounded w-24"></div>
                <div className="h-3 bg-slate-700 rounded w-full"></div>
                <div className="h-3 bg-slate-700 rounded w-3/4"></div>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="h-8 bg-slate-700 rounded"></div>
                <div className="h-8 bg-slate-700 rounded"></div>
                <div className="h-8 bg-slate-700 rounded"></div>
              </div>
              <div className="flex justify-between">
                <div className="h-4 bg-slate-700 rounded w-20"></div>
                <div className="h-8 bg-slate-700 rounded w-24"></div>
              </div>
            </div>
          ))}
        </div>
      }>
        <TagGroupsList searchParams={searchParams} />
      </Suspense>
    </div>
  );
}