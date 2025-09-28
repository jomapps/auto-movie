'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { PromptTemplate } from '@/types/prompts';
import { DynamicForm } from '@/components/prompts/DynamicForm';

interface TemplateDetailPageProps {
  params: Promise<{ id: string }>;
}

// Mock data - replace with actual PayloadCMS query
const mockTemplate: PromptTemplate = {
  id: '1',
  name: 'Character Development Prompt',
  app: 'character-service',
  stage: 'development',
  feature: 'character-creation',
  tags: ['character', 'development', 'personality'],
  model: 'claude-3-sonnet',
  template: 'Create a detailed character profile for {{characterName}} in the {{genre}} genre. Consider their background, motivations, and character arc. Focus on:\n\n1. Physical appearance and mannerisms\n2. Personality traits and quirks\n3. Background and history\n4. Goals and motivations\n5. Character arc throughout the story\n\n{{additionalNotes}}',
  variableDefs: [
    { 
      name: 'characterName', 
      type: 'string', 
      required: true, 
      description: 'Name of the character to develop' 
    },
    { 
      name: 'genre', 
      type: 'string', 
      required: true, 
      options: ['drama', 'comedy', 'action', 'horror', 'sci-fi', 'fantasy'],
      description: 'The genre of the story'
    },
    {
      name: 'additionalNotes',
      type: 'string',
      required: false,
      description: 'Any additional notes or specific requirements'
    }
  ],
  outputSchema: {
    type: 'object',
    properties: {
      characterProfile: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          appearance: { type: 'string' },
          personality: { type: 'array', items: { type: 'string' } },
          background: { type: 'string' },
          motivations: { type: 'array', items: { type: 'string' } },
          characterArc: { type: 'string' }
        }
      }
    }
  },
  notes: 'Used for generating detailed character profiles with consistent structure',
  createdAt: '2024-01-15T10:00:00Z',
  updatedAt: '2024-01-20T14:30:00Z',
  version: 1
};

export default function TemplateDetailPage({ params }: TemplateDetailPageProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'test' | 'versions'>('details');
  const [testInputs, setTestInputs] = useState<Record<string, any>>({});
  const [resolvedPrompt, setResolvedPrompt] = useState<string>('');
  
  // In a real implementation, you would fetch the template using the ID
  const template = mockTemplate;

  const resolveTemplate = (inputs: Record<string, any>) => {
    let resolved = template.template;
    Object.entries(inputs).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      resolved = resolved.replace(new RegExp(placeholder, 'g'), value || '');
    });
    setResolvedPrompt(resolved);
  };

  const handleTestInputChange = (inputs: Record<string, any>) => {
    setTestInputs(inputs);
    resolveTemplate(inputs);
  };

  const tabs = [
    { id: 'details', label: 'Details', icon: '📋' },
    { id: 'test', label: 'Test', icon: '🧪' },
    { id: 'versions', label: 'Versions', icon: '📚' }
  ] as const;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/prompts/templates"
            className="text-slate-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">{template.name}</h1>
            <div className="flex items-center space-x-2 mt-1">
              <span className="px-2 py-1 text-xs font-medium bg-purple-600 text-white rounded">
                {template.app}
              </span>
              <span className="px-2 py-1 text-xs font-medium bg-blue-600 text-white rounded">
                {template.stage}
              </span>
              <span className="px-2 py-1 text-xs font-medium bg-green-600 text-white rounded">
                v{template.version}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <Link
            href={`/prompts/test?templateId=${template.id}`}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
          >
            Test Template
          </Link>
          <Link
            href={`/prompts/templates/${template.id}/edit`}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md hover:bg-purple-700"
          >
            Edit
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-700">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-purple-500 text-purple-400'
                  : 'border-transparent text-slate-400 hover:text-slate-300 hover:border-slate-600'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-slate-800 rounded-lg p-6">
        {activeTab === 'details' && (
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Basic Information</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Name</label>
                    <p className="text-white">{template.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Feature</label>
                    <p className="text-white">{template.feature}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Model</label>
                    <p className="text-white font-mono">{template.model}</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Metadata</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Tags</label>
                    <div className="flex flex-wrap gap-1">
                      {template.tags.map((tag, index) => (
                        <span key={index} className="px-2 py-1 text-xs bg-slate-700 text-slate-300 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Created</label>
                    <p className="text-white">{new Date(template.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Updated</label>
                    <p className="text-white">{new Date(template.updatedAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Template Content */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Template</h3>
              <div className="bg-slate-900 rounded p-4">
                <pre className="text-sm text-slate-300 whitespace-pre-wrap font-mono">
                  {template.template}
                </pre>
              </div>
            </div>

            {/* Variables */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Variable Definitions</h3>
              <div className="space-y-4">
                {template.variableDefs.map((variable, index) => (
                  <div key={index} className="bg-slate-700 rounded p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-white">{variable.name}</h4>
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-1 text-xs bg-blue-600 text-white rounded">
                          {variable.type}
                        </span>
                        {variable.required && (
                          <span className="px-2 py-1 text-xs bg-red-600 text-white rounded">
                            Required
                          </span>
                        )}
                      </div>
                    </div>
                    {variable.description && (
                      <p className="text-sm text-slate-300 mb-2">{variable.description}</p>
                    )}
                    {variable.defaultValue !== undefined && (
                      <p className="text-xs text-slate-400">
                        Default: {typeof variable.defaultValue === 'object' 
                          ? JSON.stringify(variable.defaultValue) 
                          : variable.defaultValue.toString()}
                      </p>
                    )}
                    {variable.options && (
                      <div className="mt-2">
                        <p className="text-xs text-slate-400 mb-1">Options:</p>
                        <div className="flex flex-wrap gap-1">
                          {variable.options.map((option, i) => (
                            <span key={i} className="px-2 py-1 text-xs bg-slate-600 text-slate-300 rounded">
                              {option}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Output Schema */}
            {template.outputSchema && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Expected Output Schema</h3>
                <div className="bg-slate-900 rounded p-4">
                  <pre className="text-sm text-slate-300 whitespace-pre-wrap font-mono">
                    {JSON.stringify(template.outputSchema, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {/* Notes */}
            {template.notes && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Notes</h3>
                <p className="text-slate-300">{template.notes}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'test' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Input Form */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Test Inputs</h3>
                <DynamicForm
                  variableDefs={template.variableDefs}
                  onInputChange={handleTestInputChange}
                />
              </div>

              {/* Preview */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Resolved Prompt</h3>
                <div className="bg-slate-900 rounded p-4 min-h-[200px]">
                  <pre className="text-sm text-slate-300 whitespace-pre-wrap font-mono">
                    {resolvedPrompt || 'Fill in the inputs to see the resolved prompt...'}
                  </pre>
                </div>
                
                {resolvedPrompt && (
                  <div className="mt-4 flex space-x-3">
                    <Link
                      href={`/prompts/test?templateId=${template.id}&inputs=${encodeURIComponent(JSON.stringify(testInputs))}`}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md font-medium transition-colors"
                    >
                      Execute Prompt
                    </Link>
                    <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-md font-medium transition-colors">
                      Copy Prompt
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'versions' && (
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Version History</h3>
            <div className="space-y-4">
              <div className="bg-slate-700 rounded p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <span className="px-2 py-1 text-xs bg-green-600 text-white rounded">
                      v{template.version} (Current)
                    </span>
                    <span className="text-sm text-slate-300">
                      {new Date(template.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <button className="text-sm text-purple-400 hover:text-purple-300">
                    View Changes
                  </button>
                </div>
                <p className="text-sm text-slate-400">Latest version with improved variable definitions</p>
              </div>
              
              {/* Mock previous versions */}
              <div className="bg-slate-700 rounded p-4 opacity-75">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <span className="px-2 py-1 text-xs bg-slate-600 text-white rounded">
                      v1.0
                    </span>
                    <span className="text-sm text-slate-300">
                      {new Date(template.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex space-x-2">
                    <button className="text-sm text-purple-400 hover:text-purple-300">
                      Restore
                    </button>
                    <button className="text-sm text-slate-400 hover:text-slate-300">
                      Compare
                    </button>
                  </div>
                </div>
                <p className="text-sm text-slate-400">Initial version of the template</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}