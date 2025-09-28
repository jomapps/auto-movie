import { PromptTemplate, PromptExecution } from '@/types/prompts';

export interface TagGroup {
  name: string;
  count: number;
  templates: PromptTemplate[];
  prefix: string;
}

export interface TagGroupExecution {
  id: string;
  groupName: string;
  projectId?: string;
  steps: TagGroupStep[];
  currentStepIndex: number;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'paused';
  startedAt?: string;
  completedAt?: string;
  notes?: string;
}

export interface TagGroupStep {
  id: string;
  templateId: string;
  templateName: string;
  order: number;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  inputs: Record<string, any>;
  execution?: PromptExecution;
  notes?: string;
  startedAt?: string;
  completedAt?: string;
}

export interface TagGroupProgress {
  groupExecutionId: string;
  currentStep: number;
  totalSteps: number;
  completedSteps: number;
  skippedSteps: number;
  failedSteps: number;
}

/**
 * Parse tag format to extract prefix and numeric order
 * Format: alphabeticPrefix-numericOrder (e.g., mainReference-001)
 */
export function parseTag(tag: string): { prefix: string; order: number } | null {
  const match = tag.match(/^([a-zA-Z]+)-(\d+)$/);
  if (!match) return null;
  
  return {
    prefix: match[1],
    order: parseInt(match[2], 10)
  };
}

/**
 * Extract tag groups from a list of templates
 * Groups templates by tag prefix and sorts by numeric suffix
 */
export function extractTagGroups(templates: PromptTemplate[]): TagGroup[] {
  const groupMap = new Map<string, PromptTemplate[]>();
  
  // Group templates by tag prefix
  templates.forEach(template => {
    template.tags.forEach(tag => {
      const parsed = parseTag(tag);
      if (parsed) {
        const existing = groupMap.get(parsed.prefix) || [];
        existing.push(template);
        groupMap.set(parsed.prefix, existing);
      }
    });
  });
  
  // Convert to TagGroup array and sort templates within each group
  const groups: TagGroup[] = [];
  
  groupMap.forEach((groupTemplates, prefix) => {
    // Remove duplicates and sort by order
    const uniqueTemplates = Array.from(
      new Map(groupTemplates.map(t => [t.id, t])).values()
    );
    
    const sortedTemplates = uniqueTemplates.sort((a, b) => {
      // Find the tag with this prefix and compare order
      const aTag = a.tags.find(tag => parseTag(tag)?.prefix === prefix);
      const bTag = b.tags.find(tag => parseTag(tag)?.prefix === prefix);
      
      if (!aTag || !bTag) return 0;
      
      const aParsed = parseTag(aTag);
      const bParsed = parseTag(bTag);
      
      if (!aParsed || !bParsed) return 0;
      
      return aParsed.order - bParsed.order;
    });
    
    groups.push({
      name: prefix,
      count: sortedTemplates.length,
      templates: sortedTemplates,
      prefix
    });
  });
  
  // Sort groups by name
  return groups.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Get templates for a specific tag group, sorted by order
 */
export function getTagGroupTemplates(templates: PromptTemplate[], groupName: string): PromptTemplate[] {
  const groupTemplates = templates.filter(template => 
    template.tags.some(tag => parseTag(tag)?.prefix === groupName)
  );
  
  return groupTemplates.sort((a, b) => {
    const aTag = a.tags.find(tag => parseTag(tag)?.prefix === groupName);
    const bTag = b.tags.find(tag => parseTag(tag)?.prefix === groupName);
    
    if (!aTag || !bTag) return 0;
    
    const aParsed = parseTag(aTag);
    const bParsed = parseTag(bTag);
    
    if (!aParsed || !bParsed) return 0;
    
    return aParsed.order - bParsed.order;
  });
}

/**
 * Create a new tag group execution
 */
export function createTagGroupExecution(
  groupName: string,
  templates: PromptTemplate[],
  projectId?: string
): TagGroupExecution {
  const sortedTemplates = getTagGroupTemplates(templates, groupName);
  
  const steps: TagGroupStep[] = sortedTemplates.map((template, index) => {
    const tagMatch = template.tags.find(tag => parseTag(tag)?.prefix === groupName);
    const order = tagMatch ? parseTag(tagMatch)?.order || index + 1 : index + 1;
    
    return {
      id: `step-${template.id}-${Date.now()}`,
      templateId: template.id,
      templateName: template.name,
      order,
      status: 'pending',
      inputs: {},
      notes: ''
    };
  });
  
  return {
    id: `tg-exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    groupName,
    projectId,
    steps,
    currentStepIndex: 0,
    status: 'pending'
  };
}

/**
 * Calculate progress statistics for a tag group execution
 */
export function calculateProgress(execution: TagGroupExecution): TagGroupProgress {
  const { steps, currentStepIndex } = execution;
  
  const completedSteps = steps.filter(step => step.status === 'completed').length;
  const skippedSteps = steps.filter(step => step.status === 'skipped').length;
  const failedSteps = steps.filter(step => step.status === 'failed').length;
  
  return {
    groupExecutionId: execution.id,
    currentStep: currentStepIndex + 1,
    totalSteps: steps.length,
    completedSteps,
    skippedSteps,
    failedSteps
  };
}

/**
 * Get next step in sequence
 */
export function getNextStep(execution: TagGroupExecution): TagGroupStep | null {
  const { steps, currentStepIndex } = execution;
  
  if (currentStepIndex >= steps.length - 1) return null;
  
  return steps[currentStepIndex + 1];
}

/**
 * Get previous step in sequence
 */
export function getPreviousStep(execution: TagGroupExecution): TagGroupStep | null {
  const { steps, currentStepIndex } = execution;
  
  if (currentStepIndex <= 0) return null;
  
  return steps[currentStepIndex - 1];
}

/**
 * Check if execution can move to next step
 */
export function canMoveNext(execution: TagGroupExecution): boolean {
  const { steps, currentStepIndex } = execution;
  
  if (currentStepIndex >= steps.length - 1) return false;
  
  const currentStep = steps[currentStepIndex];
  return currentStep.status === 'completed' || currentStep.status === 'skipped';
}

/**
 * Check if execution can move to previous step
 */
export function canMovePrevious(execution: TagGroupExecution): boolean {
  const { currentStepIndex } = execution;
  return currentStepIndex > 0;
}

/**
 * Extract variable values from previous step outputs for carry-over
 */
export function extractVariablesFromOutput(output: string): Record<string, any> {
  const variables: Record<string, any> = {};
  
  try {
    // Try to parse as JSON first
    const parsed = JSON.parse(output);
    if (typeof parsed === 'object' && parsed !== null) {
      return parsed;
    }
  } catch {
    // If not JSON, extract key-value patterns
    const patterns = [
      /([a-zA-Z_][a-zA-Z0-9_]*)\s*[:=]\s*"([^"]+)"/g,
      /([a-zA-Z_][a-zA-Z0-9_]*)\s*[:=]\s*'([^']+)'/g,
      /([a-zA-Z_][a-zA-Z0-9_]*)\s*[:=]\s*([^\s,;]+)/g
    ];
    
    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(output)) !== null) {
        variables[match[1]] = match[2];
      }
    });
  }
  
  return variables;
}

/**
 * Generate summary of tag group execution
 */
export function generateExecutionSummary(execution: TagGroupExecution): {
  summary: string;
  statistics: {
    total: number;
    completed: number;
    skipped: number;
    failed: number;
    successRate: number;
    totalExecutionTime: number;
  };
  results: Array<{
    stepName: string;
    status: string;
    executionTime?: number;
    hasOutput: boolean;
  }>;
} {
  const progress = calculateProgress(execution);
  const totalExecutionTime = execution.steps.reduce((total, step) => {
    if (step.execution?.executionTime) {
      return total + step.execution.executionTime;
    }
    return total;
  }, 0);
  
  const successRate = progress.totalSteps > 0 
    ? (progress.completedSteps / progress.totalSteps) * 100 
    : 0;
  
  const results = execution.steps.map(step => ({
    stepName: step.templateName,
    status: step.status,
    executionTime: step.execution?.executionTime,
    hasOutput: !!step.execution?.outputRaw
  }));
  
  const summary = `Tag Group '${execution.groupName}' execution completed. ` +
    `${progress.completedSteps}/${progress.totalSteps} steps successful ` +
    `(${successRate.toFixed(1)}% success rate). ` +
    `Total execution time: ${(totalExecutionTime / 1000).toFixed(2)}s.`;
  
  return {
    summary,
    statistics: {
      total: progress.totalSteps,
      completed: progress.completedSteps,
      skipped: progress.skippedSteps,
      failed: progress.failedSteps,
      successRate,
      totalExecutionTime
    },
    results
  };
}

/**
 * Save execution state to localStorage
 */
export function saveExecutionState(execution: TagGroupExecution): void {
  try {
    const key = `taggroup-execution-${execution.id}`;
    localStorage.setItem(key, JSON.stringify(execution));
    
    // Also save a list of active executions
    const activeKey = 'taggroup-active-executions';
    const active = JSON.parse(localStorage.getItem(activeKey) || '[]');
    
    if (!active.includes(execution.id)) {
      active.push(execution.id);
      localStorage.setItem(activeKey, JSON.stringify(active));
    }
  } catch (error) {
    console.error('Failed to save execution state:', error);
  }
}

/**
 * Load execution state from localStorage
 */
export function loadExecutionState(executionId: string): TagGroupExecution | null {
  try {
    const key = `taggroup-execution-${executionId}`;
    const stored = localStorage.getItem(key);
    
    if (!stored) return null;
    
    return JSON.parse(stored);
  } catch (error) {
    console.error('Failed to load execution state:', error);
    return null;
  }
}

/**
 * Get all active execution IDs
 */
export function getActiveExecutions(): string[] {
  try {
    const activeKey = 'taggroup-active-executions';
    const active = localStorage.getItem(activeKey);
    
    return active ? JSON.parse(active) : [];
  } catch (error) {
    console.error('Failed to get active executions:', error);
    return [];
  }
}

/**
 * Clear execution from active list
 */
export function clearExecutionState(executionId: string): void {
  try {
    // Remove from localStorage
    const key = `taggroup-execution-${executionId}`;
    localStorage.removeItem(key);
    
    // Remove from active list
    const activeKey = 'taggroup-active-executions';
    const active = JSON.parse(localStorage.getItem(activeKey) || '[]');
    const filtered = active.filter((id: string) => id !== executionId);
    localStorage.setItem(activeKey, JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to clear execution state:', error);
  }
}