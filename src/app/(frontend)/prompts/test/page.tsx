'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { DynamicForm } from '@/components/prompts/DynamicForm';
import { PromptTemplate, PromptTestForm } from '@/types/prompts';

const mockTemplate: PromptTemplate = {
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
  createdAt: '2024-01-15T10:00:00Z',
  updatedAt: '2024-01-20T14:30:00Z',
  version: 1
};

function TestPageContent() {
  const searchParams = useSearchParams();
  const templateId = searchParams.get('templateId');
  const initialInputs = searchParams.get('inputs');

  const [template, setTemplate] = useState<PromptTemplate | null>(templateId ? mockTemplate : null);
  const [inputs, setInputs] = useState<Record<string, any>>({});
  const [resolvedPrompt, setResolvedPrompt] = useState<string>('');
  const [model, setModel] = useState<string>('claude-3-sonnet');
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');

  const router = useRouter();

  // Load template by ID when provided
  useEffect(() => {
    if (templateId) {
      (async () => {
        try {
          const res = await fetch(`/api/prompt-templates/${templateId}`);
          if (res.ok) {
            const data = await res.json();
            setTemplate(data);
          }
        } catch (e) {
          console.error('Failed to load template:', e);
        }
      })();
    }
  }, [templateId]);

  useEffect(() => {
    if (initialInputs) {
      try {
        const parsedInputs = JSON.parse(decodeURIComponent(initialInputs));
        setInputs(parsedInputs);
      } catch (error) {
        console.error('Failed to parse initial inputs:', error);
      }
    }
  }, [initialInputs]);

  useEffect(() => {
    if (template) {
      resolveTemplate(inputs);
    }
  }, [template, inputs]);

  const resolveTemplate = (currentInputs: Record<string, any>) => {
    if (!template) return;

    let resolved = template.template;
    Object.entries(currentInputs).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      resolved = resolved.replace(new RegExp(placeholder, 'g'), value || `{{${key}}}`);
    });
    setResolvedPrompt(resolved);
  };

  const handleInputChange = (newInputs: Record<string, any>) => {
    setInputs(newInputs);
  };

  const executePrompt = async () => {
    if (!resolvedPrompt.trim()) {
      alert('Please enter a prompt to execute');
      return;
    }

    setIsExecuting(true);
    try {
      // Mock API call - replace with actual implementation
      const response = await fetch('/api/prompts/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          templateId: template?.id,
          model,
          inputs,
          resolvedPrompt,
          projectId: searchParams.get('projectId'),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to execute prompt');
      }

      const result = await response.json();
      setExecutionResult(result);
    } catch (error) {
      console.error('Error executing prompt:', error);
      // Mock result for demonstration
      setExecutionResult({
        id: 'exec-' + Date.now(),
        status: 'completed',
        outputRaw: `Character Profile for ${inputs.characterName || 'Unknown Character'}:\n\nName: ${inputs.characterName || 'Unknown Character'}\nGenre: ${inputs.genre || 'Unspecified'}\n\nPhysical Description:\n[Detailed character appearance]\n\nPersonality:\n[Character traits and quirks]\n\nBackground:\n[Character history and background]\n\nMotivations:\n[What drives this character]\n\nCharacter Arc:\n[How the character changes throughout the story]`,
        executionTime: Math.random() * 5000 + 1000,
        createdAt: new Date().toISOString(),
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const saveExecution = async () => {
    if (!executionResult) return;

    try {
      const response = await fetch('/api/prompts/executions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...executionResult,
          templateId: template?.id,
          templateName: template?.name,
          app: template?.app || 'auto-movie',
          stage: template?.stage || 'development',
          feature: template?.feature || 'test',
          tags: template?.tags || [],
          model,
          inputs,
          resolvedPrompt,
        }),
      });

      if (response.ok) {
        alert('Execution saved successfully!');
      }
    } catch (error) {
      console.error('Failed to save execution:', error);
      alert('Failed to save execution');
    }
  };

  const saveAsNewTemplate = async () => {
    if (!newTemplateName.trim()) {
      alert('Please enter a template name');
      return;
    }

    try {
      const newTemplate = {
        name: newTemplateName,
        app: 'auto-movie',
        stage: 'development',
        feature: 'custom',
        tags: ['custom', 'test'],
        model,
        template: resolvedPrompt,
        variableDefs: [],
        notes: 'Created from test execution',
      };

      const response = await fetch('/api/prompt-templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newTemplate),
      });

      if (response.ok) {
        alert('Template saved successfully!');
        setSaveAsTemplate(false);
        setNewTemplateName('');
      }
    } catch (error) {
      console.error('Failed to save template:', error);
      alert('Failed to save template');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Prompt Testing</h1>
          <p className="text-slate-400 mt-1">
            {template ? `Testing: ${template.name}` : 'Test custom prompts and save results'}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {template && (
            <span className="px-3 py-1 text-sm bg-purple-600 text-white rounded">
              {template.name}
            </span>
          )}
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="claude-3-sonnet">Claude 3 Sonnet</option>
            <option value="claude-3-opus">Claude 3 Opus</option>
            <option value="claude-3-haiku">Claude 3 Haiku</option>
            <option value="gpt-4">GPT-4</option>
            <option value="gpt-4-turbo">GPT-4 Turbo</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Input */}
        <div className="space-y-6">
          {/* Dynamic Form for Template Variables */}
          {template && (
            <div className="bg-slate-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Template Variables</h2>
              <DynamicForm
                variableDefs={template.variableDefs}
                initialValues={inputs}
                onInputChange={handleInputChange}
              />
            </div>
          )}

          {/* Manual Prompt Input */}
          <div className="bg-slate-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">
              {template ? 'Resolved Prompt' : 'Custom Prompt'}
            </h2>
            <textarea
              value={template ? resolvedPrompt : resolvedPrompt}
              onChange={(e) => !template && setResolvedPrompt(e.target.value)}
              placeholder="Enter your prompt here..."
              className="w-full h-64 px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-vertical"
              readOnly={!!template}
            />

            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-slate-400">
                {resolvedPrompt.length} characters
              </div>

              <button
                onClick={executePrompt}
                disabled={isExecuting || !resolvedPrompt.trim()}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-md font-medium transition-colors flex items-center space-x-2"
              >
                {isExecuting && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                )}
                <span>{isExecuting ? 'Executing...' : 'Execute Prompt'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column - Output */}
        <div className="space-y-6">
          {/* Execution Result */}
          <div className="bg-slate-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Result</h2>

            {!executionResult && (
              <div className="text-center py-12 text-slate-400">
                <div className="text-4xl mb-4">🧪</div>
                <p>Execute a prompt to see results here</p>
              </div>
            )}

            {executionResult && (
              <div className="space-y-4">
                {/* Status & Metrics */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                      executionResult.status === 'completed' ? 'bg-green-600 text-white' :
                      executionResult.status === 'failed' ? 'bg-red-600 text-white' :
                      'bg-yellow-600 text-white'
                    }`}>
                      {executionResult.status}
                    </span>
                    {executionResult.executionTime && (
                      <span className="text-sm text-slate-400">
                        {Math.round(executionResult.executionTime)}ms
                      </span>
                    )}
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => executionResult?.id ? router.push(`/prompts/executions/${executionResult.id}`) : alert('This execution has no ID to view')}
                      className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                    >
                      Save Execution
                    </button>
                    <button
                      onClick={() => setSaveAsTemplate(true)}
                      className="px-3 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
                    >
                      Save as Template
                    </button>
                  </div>
                </div>

                {/* Output */}
                <div className="bg-slate-900 rounded p-4">
                  <h3 className="text-sm font-medium text-slate-300 mb-2">Raw Output</h3>
                  <pre className="text-sm text-slate-300 whitespace-pre-wrap">
                    {executionResult.outputRaw || 'No output available'}
                  </pre>
                </div>

                {/* Error Message */}
                {executionResult.errorMessage && (
                  <div className="bg-red-900/20 border border-red-600 rounded p-4">
                    <h3 className="text-sm font-medium text-red-400 mb-2">Error</h3>
                    <p className="text-sm text-red-300">{executionResult.errorMessage}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Save as Template Modal */}
      {saveAsTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-white mb-4">Save as Template</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Template Name
                </label>
                <input
                  type="text"
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  placeholder="Enter template name..."
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={saveAsNewTemplate}
                  className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md font-medium transition-colors"
                >
                  Save Template
                </button>
                <button
                  onClick={() => setSaveAsTemplate(false)}
                  className="flex-1 px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-md font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TestPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-900 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-slate-800 rounded-lg p-6 animate-pulse">
            <div className="h-8 bg-slate-700 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-slate-700 rounded w-2/3 mb-8"></div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 bg-slate-700 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    }>
      <TestPageContent />
    </Suspense>
  );
}