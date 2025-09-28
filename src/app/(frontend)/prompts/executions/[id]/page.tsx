import React from 'react';
import Link from 'next/link';
import { PromptExecution } from '@/types/prompts';

interface ExecutionDetailPageProps {
  params: Promise<{ id: string }>;
}

// Mock data - replace with actual PayloadCMS query
const mockExecution: PromptExecution = {
  id: 'exec-1',
  templateId: 'template-1',
  templateName: 'Character Development Prompt',
  app: 'character-service',
  stage: 'development',
  feature: 'character-creation',
  projectId: 'proj-123',
  tags: ['character', 'development', 'personality'],
  model: 'claude-3-sonnet',
  inputs: {
    characterName: 'Sarah Connor',
    genre: 'sci-fi',
    additionalNotes: 'Focus on her transformation from ordinary woman to resistance leader'
  },
  resolvedPrompt: `Create a detailed character profile for Sarah Connor in the sci-fi genre. Consider their background, motivations, and character arc. Focus on:\n\n1. Physical appearance and mannerisms\n2. Personality traits and quirks\n3. Background and history\n4. Goals and motivations\n5. Character arc throughout the story\n\nFocus on her transformation from ordinary woman to resistance leader`,
  status: 'completed',
  outputRaw: `Character Profile for Sarah Connor:\n\n**Physical Appearance:**\nSarah Connor is a woman in her late twenties with shoulder-length brown hair that she often wears pulled back in a practical ponytail. She has intense green eyes that reflect both determination and the weight of knowledge about humanity's future. Her build is athletic and toned, developed through rigorous training. She typically dresses in practical clothing - jeans, boots, and fitted tops that allow for easy movement.\n\n**Personality Traits:**\n- Fiercely protective, especially of her son John\n- Highly intelligent and strategic\n- Paranoid due to her experiences with time travel and machines\n- Determined to the point of obsession\n- Resourceful and adaptable\n- Initially skeptical but learns to trust when necessary\n\n**Background:**\nSarah was an ordinary waitress living in Los Angeles when her life was forever changed by the arrival of a cyborg assassin from the future. Learning that she would give birth to humanity's savior, she was forced to confront an unbelievable reality and transform herself from victim to warrior.\n\n**Goals and Motivations:**\n- Primary: Protect her son John Connor at all costs\n- Secondary: Prevent or prepare for the war against machines\n- Personal: Come to terms with her destiny and the burden of knowledge\n\n**Character Arc:**\nSarah's journey is one of the most dramatic transformations in cinema. She evolves from a vulnerable, ordinary woman into a hardened, militaristic survivor. This transformation comes at great personal cost, including her mental health and relationships, but is necessary for her to fulfill her role in humanity's survival.`,
  outputParsed: {
    characterProfile: {
      name: 'Sarah Connor',
      appearance: 'Athletic woman in her late twenties with brown hair and green eyes',
      personality: ['Protective', 'Intelligent', 'Determined', 'Resourceful'],
      background: 'Former waitress transformed by knowledge of future war',
      motivations: ['Protect John Connor', 'Prevent machine war'],
      characterArc: 'Transformation from ordinary woman to hardened warrior'
    }
  },
  executionTime: 3240,
  notes: 'Execution completed successfully with detailed character analysis',
  createdAt: '2024-01-20T10:30:00Z',
  updatedAt: '2024-01-20T10:30:45Z'
};

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

export default async function ExecutionDetailPage({ params }: ExecutionDetailPageProps) {
  const { id } = await params;
  
  // In a real implementation, you would fetch the execution using the ID
  const execution = mockExecution;

  if (!execution) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <h3 className="text-red-800 dark:text-red-200 font-semibold mb-2">
            Execution Not Found
          </h3>
          <p className="text-red-700 dark:text-red-300">
            The execution with ID "{id}" could not be found.
          </p>
          <Link
            href="/prompts/executions"
            className="inline-block mt-4 text-red-600 hover:text-red-500 underline"
          >
            Back to Executions
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/prompts/executions"
            className="text-slate-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">
              {execution.templateName || 'Custom Prompt Execution'}
            </h1>
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-lg">{getStatusIcon(execution.status)}</span>
              <span className={`px-2 py-1 text-xs font-medium text-white rounded ${getStatusColor(execution.status)}`}>
                {execution.status}
              </span>
              <span className="px-2 py-1 text-xs font-medium bg-purple-600 text-white rounded">
                {execution.app}
              </span>
              <span className="px-2 py-1 text-xs font-medium bg-blue-600 text-white rounded">
                {execution.stage}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {execution.templateId && (
            <Link
              href={`/prompts/test?templateId=${execution.templateId}&inputs=${encodeURIComponent(JSON.stringify(execution.inputs))}`}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Rerun
            </Link>
          )}
          <Link
            href={`/prompts/templates/${execution.templateId}`}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md hover:bg-purple-700"
          >
            View Template
          </Link>
        </div>
      </div>

      {/* Execution Info Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Execution Metadata */}
        <div className="bg-slate-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Execution Details</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Execution ID</label>
              <p className="text-white font-mono text-sm">{execution.id}</p>
            </div>
            
            {execution.templateId && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Template ID</label>
                <Link 
                  href={`/prompts/templates/${execution.templateId}`}
                  className="text-purple-400 hover:text-purple-300 font-mono text-sm underline"
                >
                  {execution.templateId}
                </Link>
              </div>
            )}
            
            {execution.projectId && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Project ID</label>
                <p className="text-white font-mono text-sm">{execution.projectId}</p>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Model</label>
              <p className="text-white font-mono">{execution.model}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Feature</label>
              <p className="text-white">{execution.feature}</p>
            </div>
            
            {execution.executionTime && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Execution Time</label>
                <p className="text-white">{Math.round(execution.executionTime)}ms</p>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Created</label>
              <p className="text-white">
                {new Date(execution.createdAt).toLocaleString()}
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Updated</label>
              <p className="text-white">
                {new Date(execution.updatedAt).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Tags */}
        <div className="bg-slate-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Tags</h2>
          {execution.tags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {execution.tags.map((tag, index) => (
                <span key={index} className="px-3 py-1 text-sm bg-slate-700 text-slate-300 rounded">
                  {tag}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-slate-400">No tags assigned</p>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-slate-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Actions</h2>
          <div className="space-y-3">
            <button
              onClick={() => navigator.clipboard.writeText(execution.resolvedPrompt)}
              className="w-full flex items-center space-x-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span>Copy Prompt</span>
            </button>
            
            {execution.outputRaw && (
              <button
                onClick={() => navigator.clipboard.writeText(execution.outputRaw!)}
                className="w-full flex items-center space-x-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Copy Output</span>
              </button>
            )}
            
            <button className="w-full flex items-center space-x-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
              </svg>
              <span>Share</span>
            </button>
          </div>
        </div>
      </div>

      {/* Inputs */}
      <div className="bg-slate-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Input Variables</h2>
        {Object.keys(execution.inputs).length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(execution.inputs).map(([key, value]) => (
              <div key={key} className="bg-slate-700 rounded p-4">
                <label className="block text-sm font-medium text-slate-300 mb-2">{key}</label>
                <div className="bg-slate-900 rounded p-3">
                  <pre className="text-sm text-slate-300 whitespace-pre-wrap">
                    {typeof value === 'object' ? JSON.stringify(value, null, 2) : value}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-400">No input variables</p>
        )}
      </div>

      {/* Resolved Prompt */}
      <div className="bg-slate-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Resolved Prompt</h2>
        <div className="bg-slate-900 rounded p-4">
          <pre className="text-sm text-slate-300 whitespace-pre-wrap">
            {execution.resolvedPrompt}
          </pre>
        </div>
      </div>

      {/* Output */}
      {execution.status === 'completed' && execution.outputRaw && (
        <div className="bg-slate-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Output</h2>
          
          {/* Raw Output */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-slate-300 mb-2">Raw Output</h3>
              <div className="bg-slate-900 rounded p-4 max-h-96 overflow-y-auto">
                <pre className="text-sm text-slate-300 whitespace-pre-wrap">
                  {execution.outputRaw}
                </pre>
              </div>
            </div>
            
            {/* Parsed Output */}
            {execution.outputParsed && (
              <div>
                <h3 className="text-lg font-medium text-slate-300 mb-2">Parsed Output</h3>
                <div className="bg-slate-900 rounded p-4">
                  <pre className="text-sm text-slate-300 whitespace-pre-wrap">
                    {JSON.stringify(execution.outputParsed, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error */}
      {execution.status === 'failed' && execution.errorMessage && (
        <div className="bg-red-900/20 border border-red-600 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-red-400 mb-4">Error Details</h2>
          <div className="bg-red-900/30 rounded p-4">
            <p className="text-red-300">{execution.errorMessage}</p>
          </div>
        </div>
      )}

      {/* Notes */}
      {execution.notes && (
        <div className="bg-slate-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Notes</h2>
          <p className="text-slate-300">{execution.notes}</p>
        </div>
      )}
    </div>
  );
}