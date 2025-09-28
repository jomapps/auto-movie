'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { PromptTemplate, PromptExecution } from '@/types/prompts';
import { TagGroupStepper } from '@/components/prompts/TagGroupStepper';
import { useTagGroupExecution } from '@/hooks/useTagGroupExecution';
import { getTagGroupTemplates, generateExecutionSummary } from '@/lib/prompts/tag-utils';

interface TagGroupRunPageProps {
  params: Promise<{ group: string }>;
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
    template: 'Create the main reference document for {{projectName}} with genre {{genre}}. Include key themes, target audience, and core narrative elements.',
    variableDefs: [
      { name: 'projectName', type: 'string', required: true, description: 'Name of the project' },
      { name: 'genre', type: 'string', required: true, options: ['drama', 'comedy', 'action', 'horror', 'sci-fi', 'thriller'] }
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
    template: 'Develop main characters for {{projectName}} based on the reference: {{mainReference}}. Create detailed character profiles with backgrounds, motivations, and arcs.',
    variableDefs: [
      { name: 'projectName', type: 'string', required: true, description: 'Name of the project' },
      { name: 'mainReference', type: 'string', required: true, description: 'Main reference document from previous step' }
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
    template: 'Create story structure for {{projectName}} with characters: {{characters}}. Include three-act structure, plot points, and character development arcs.',
    variableDefs: [
      { name: 'projectName', type: 'string', required: true, description: 'Name of the project' },
      { name: 'characters', type: 'string', required: true, description: 'Character descriptions from previous step' }
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
    template: 'Plan scenes for {{projectName}} based on story structure {{storyStructure}}. Create scene breakdown with locations, characters, and key events.',
    variableDefs: [
      { name: 'projectName', type: 'string', required: true, description: 'Name of the project' },
      { name: 'storyStructure', type: 'string', required: true, description: 'Story structure document from previous workflow' }
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
    template: 'Create detailed scene descriptions for {{projectName}} using plan: {{scenePlan}}. Include dialogue samples, camera directions, and mood.',
    variableDefs: [
      { name: 'projectName', type: 'string', required: true, description: 'Name of the project' },
      { name: 'scenePlan', type: 'string', required: true, description: 'Scene planning document from previous step' }
    ],
    notes: 'Second step - detailed scene creation',
    createdAt: '2024-01-16T11:00:00Z',
    updatedAt: '2024-01-21T15:30:00Z',
    version: 1
  }
];

// Mock API function - replace with actual implementation
async function executePrompt(templateId: string, inputs: Record<string, any>): Promise<PromptExecution> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
  
  const template = mockTemplates.find(t => t.id === templateId);
  if (!template) {
    throw new Error('Template not found');
  }
  
  // Simulate random success/failure
  const success = Math.random() > 0.1; // 90% success rate
  
  if (!success) {
    throw new Error('Simulated execution failure');
  }
  
  // Generate mock output based on template
  let mockOutput = '';
  if (template.feature === 'reference-creation') {
    mockOutput = `# ${inputs.projectName} - Main Reference Document\n\n**Genre:** ${inputs.genre}\n\n**Core Concept:**\nA compelling ${inputs.genre} story that explores themes of identity, growth, and human connection. The narrative follows protagonists as they navigate challenges and discover their true potential.\n\n**Target Audience:** Adults 18-35 who enjoy character-driven ${inputs.genre} stories\n\n**Key Themes:**\n- Personal transformation\n- Relationships and loyalty\n- Overcoming adversity\n\n**Tone:** Engaging, authentic, with moments of both tension and relief.`;
  } else if (template.feature === 'character-creation') {
    mockOutput = `# Character Profiles for ${inputs.projectName}\n\n## Main Protagonist\n**Name:** Alex Morgan\n**Age:** 28\n**Background:** Former architect turned freelance consultant\n**Motivation:** Seeking purpose after a major life change\n**Character Arc:** From uncertainty to self-confidence\n\n## Supporting Character\n**Name:** Riley Chen\n**Age:** 32\n**Background:** Local business owner and community leader\n**Motivation:** Protecting their community\n**Character Arc:** Learning to trust others\n\n## Antagonist\n**Name:** Victoria Sterling\n**Age:** 45\n**Background:** Corporate executive with hidden agenda\n**Motivation:** Advancing career at any cost\n**Character Arc:** Faces consequences of ruthless ambition`;
  } else if (template.feature === 'story-structure') {
    mockOutput = `# Story Structure for ${inputs.projectName}\n\n## Act 1 - Setup (25%)\n**Inciting Incident:** Alex discovers a secret that changes everything\n**Plot Point 1:** Decision to take action despite risks\n\n## Act 2A - Rising Action (25%)\n**Complications:** Growing obstacles and opposition\n**Midpoint:** Major revelation that shifts the stakes\n\n## Act 2B - Escalation (25%)\n**Crisis:** Everything falls apart\n**Plot Point 2:** Final commitment to the goal\n\n## Act 3 - Resolution (25%)\n**Climax:** Final confrontation with Victoria\n**Resolution:** New equilibrium established, characters transformed`;
  } else {
    mockOutput = `Generated content for ${template.name}:\n\nBased on the inputs provided, here is the detailed output for ${inputs.projectName}. This content builds upon previous steps and provides the foundation for subsequent workflow elements.\n\n[Generated content would appear here based on the specific template and inputs]`;
  }
  
  const execution: PromptExecution = {
    id: `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    templateId,
    templateName: template.name,
    app: template.app,
    stage: template.stage,
    feature: template.feature,
    tags: template.tags,
    model: template.model,
    inputs,
    resolvedPrompt: template.template.replace(/{{(\w+)}}/g, (match, key) => inputs[key] || match),
    status: 'completed',
    outputRaw: mockOutput,
    outputParsed: {},
    executionTime: 2000 + Math.random() * 3000,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  return execution;
}

// Export function for results
function exportResults(execution: any) {
  const summary = generateExecutionSummary(execution);
  
  const exportData = {
    groupName: execution.groupName,
    projectId: execution.projectId,
    summary: summary.summary,
    statistics: summary.statistics,
    steps: execution.steps.map((step: any) => ({
      templateName: step.templateName,
      status: step.status,
      inputs: step.inputs,
      output: step.execution?.outputRaw,
      notes: step.notes,
      executionTime: step.execution?.executionTime
    }))
  };
  
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${execution.groupName}-execution-${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function TagGroupRunPage({ params }: TagGroupRunPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [groupName, setGroupName] = useState<string>('');
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [projectId, setProjectId] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Initialize data
  useEffect(() => {
    async function initializeData() {
      try {
        const resolvedParams = await params;
        const decodedGroup = decodeURIComponent(resolvedParams.group);
        setGroupName(decodedGroup);
        
        const projectIdParam = searchParams.get('projectId');
        setProjectId(projectIdParam || undefined);
        
        // In a real implementation, fetch templates from PayloadCMS
        const groupTemplates = getTagGroupTemplates(mockTemplates, decodedGroup);
        
        if (groupTemplates.length === 0) {
          setError(`No templates found for tag group "${decodedGroup}"`);
          return;
        }
        
        setTemplates(groupTemplates);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load tag group data');
      } finally {
        setIsLoading(false);
      }
    }
    
    initializeData();
  }, [params, searchParams]);
  
  // Initialize tag group execution hook
  const execution = useTagGroupExecution({
    groupName,
    templates,
    projectId,
    autoSave: true,
    enableCarryOver: true
  });
  
  const handleExecuteStep = async (templateId: string, inputs: Record<string, any>): Promise<PromptExecution> => {
    return executePrompt(templateId, inputs);
  };
  
  const handleExportResults = () => {
    if (execution.execution) {
      exportResults(execution.execution);
    }
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading tag group execution...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">😟</div>
          <h1 className="text-2xl font-bold text-white mb-2">Error Loading Tag Group</h1>
          <p className="text-slate-400 mb-6">{error}</p>
          <div className="flex items-center justify-center space-x-4">
            <Link
              href="/prompts/tag-groups"
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              Back to Tag Groups
            </Link>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link
                href="/prompts/tag-groups"
                className="text-slate-400 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div>
                <h1 className="text-xl font-semibold text-white">
                  {groupName} Workflow
                </h1>
                <p className="text-sm text-slate-400">
                  Sequential execution of {templates.length} templates
                  {projectId && ` for project: ${projectId}`}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {execution.execution?.status === 'completed' && (
                <button
                  onClick={handleExportResults}
                  className="px-3 py-1.5 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center space-x-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Export</span>
                </button>
              )}
              
              <button
                onClick={execution.saveState}
                className="px-3 py-1.5 text-sm bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors flex items-center space-x-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span>Save</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <TagGroupStepper
          templates={templates}
          execution={execution}
          onExecuteStep={handleExecuteStep}
          onExportResults={handleExportResults}
          className="w-full"
        />
      </div>
      
      {/* Footer Info */}
      <div className="bg-slate-800 border-t border-slate-700 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between text-sm text-slate-400">
            <div className="flex items-center space-x-4">
              <span>Tag Group: {groupName}</span>
              <span>Templates: {templates.length}</span>
              {projectId && <span>Project: {projectId}</span>}
            </div>
            <div className="flex items-center space-x-4">
              <span>Auto-save enabled</span>
              <span>Variable carry-over enabled</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}