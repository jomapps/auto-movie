'use client';

import { useState, useCallback, useEffect } from 'react';
import { PromptTemplate, PromptExecution } from '@/types/prompts';
import {
  TagGroupExecution,
  TagGroupStep,
  TagGroupProgress,
  createTagGroupExecution,
  calculateProgress,
  getNextStep,
  getPreviousStep,
  canMoveNext,
  canMovePrevious,
  extractVariablesFromOutput,
  saveExecutionState,
  loadExecutionState,
  clearExecutionState
} from '@/lib/prompts/tag-utils';

export interface UseTagGroupExecutionOptions {
  groupName: string;
  templates: PromptTemplate[];
  projectId?: string;
  autoSave?: boolean;
  enableCarryOver?: boolean;
}

export interface UseTagGroupExecutionReturn {
  execution: TagGroupExecution | null;
  currentStep: TagGroupStep | null;
  progress: TagGroupProgress | null;
  isLoading: boolean;
  error: string | null;
  
  // Navigation
  canGoNext: boolean;
  canGoPrevious: boolean;
  goNext: () => boolean;
  goPrevious: () => boolean;
  goToStep: (stepIndex: number) => boolean;
  
  // Step management
  updateStepInputs: (inputs: Record<string, any>) => void;
  updateStepNotes: (notes: string) => void;
  markStepCompleted: (execution: PromptExecution) => void;
  markStepSkipped: () => void;
  markStepFailed: (error: string) => void;
  
  // Execution control
  startExecution: () => void;
  pauseExecution: () => void;
  resumeExecution: () => void;
  resetExecution: () => void;
  
  // State management
  saveState: () => void;
  loadState: (executionId: string) => boolean;
  clearState: () => void;
  
  // Variable carry-over
  getAvailableVariables: () => Record<string, any>;
  applyCarryOverVariables: () => void;
}

export function useTagGroupExecution({
  groupName,
  templates,
  projectId,
  autoSave = true,
  enableCarryOver = true
}: UseTagGroupExecutionOptions): UseTagGroupExecutionReturn {
  const [execution, setExecution] = useState<TagGroupExecution | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Initialize execution
  useEffect(() => {
    if (!execution && templates.length > 0) {
      const newExecution = createTagGroupExecution(groupName, templates, projectId);
      setExecution(newExecution);
      if (autoSave) {
        saveExecutionState(newExecution);
      }
    }
  }, [groupName, templates, projectId, autoSave, execution]);
  
  // Auto-save when execution changes
  useEffect(() => {
    if (execution && autoSave) {
      saveExecutionState(execution);
    }
  }, [execution, autoSave]);
  
  // Computed values
  const currentStep = execution ? execution.steps[execution.currentStepIndex] : null;
  const progress = execution ? calculateProgress(execution) : null;
  const canGoNext = execution ? canMoveNext(execution) : false;
  const canGoPrevious = execution ? canMovePrevious(execution) : false;
  
  // Navigation functions
  const goNext = useCallback((): boolean => {
    if (!execution || !canGoNext) return false;
    
    const nextStep = getNextStep(execution);
    if (!nextStep) return false;
    
    const newExecution = {
      ...execution,
      currentStepIndex: execution.currentStepIndex + 1
    };
    
    setExecution(newExecution);
    return true;
  }, [execution, canGoNext]);
  
  const goPrevious = useCallback((): boolean => {
    if (!execution || !canGoPrevious) return false;
    
    const newExecution = {
      ...execution,
      currentStepIndex: execution.currentStepIndex - 1
    };
    
    setExecution(newExecution);
    return true;
  }, [execution, canGoPrevious]);
  
  const goToStep = useCallback((stepIndex: number): boolean => {
    if (!execution || stepIndex < 0 || stepIndex >= execution.steps.length) {
      return false;
    }
    
    const newExecution = {
      ...execution,
      currentStepIndex: stepIndex
    };
    
    setExecution(newExecution);
    return true;
  }, [execution]);
  
  // Step management functions
  const updateStepInputs = useCallback((inputs: Record<string, any>) => {
    if (!execution || !currentStep) return;
    
    const updatedSteps = execution.steps.map(step => 
      step.id === currentStep.id 
        ? { ...step, inputs }
        : step
    );
    
    setExecution({
      ...execution,
      steps: updatedSteps
    });
  }, [execution, currentStep]);
  
  const updateStepNotes = useCallback((notes: string) => {
    if (!execution || !currentStep) return;
    
    const updatedSteps = execution.steps.map(step => 
      step.id === currentStep.id 
        ? { ...step, notes }
        : step
    );
    
    setExecution({
      ...execution,
      steps: updatedSteps
    });
  }, [execution, currentStep]);
  
  const markStepCompleted = useCallback((promptExecution: PromptExecution) => {
    if (!execution || !currentStep) return;
    
    const updatedSteps = execution.steps.map(step => 
      step.id === currentStep.id 
        ? { 
            ...step, 
            status: 'completed' as const,
            execution: promptExecution,
            completedAt: new Date().toISOString()
          }
        : step
    );
    
    const allCompleted = updatedSteps.every(step => 
      step.status === 'completed' || step.status === 'skipped'
    );
    
    setExecution({
      ...execution,
      steps: updatedSteps,
      status: allCompleted ? 'completed' : execution.status,
      completedAt: allCompleted ? new Date().toISOString() : execution.completedAt
    });
  }, [execution, currentStep]);
  
  const markStepSkipped = useCallback(() => {
    if (!execution || !currentStep) return;
    
    const updatedSteps = execution.steps.map(step => 
      step.id === currentStep.id 
        ? { 
            ...step, 
            status: 'skipped' as const,
            completedAt: new Date().toISOString()
          }
        : step
    );
    
    setExecution({
      ...execution,
      steps: updatedSteps
    });
  }, [execution, currentStep]);
  
  const markStepFailed = useCallback((errorMessage: string) => {
    if (!execution || !currentStep) return;
    
    const updatedSteps = execution.steps.map(step => 
      step.id === currentStep.id 
        ? { 
            ...step, 
            status: 'failed' as const,
            notes: step.notes ? `${step.notes}\n\nError: ${errorMessage}` : `Error: ${errorMessage}`,
            completedAt: new Date().toISOString()
          }
        : step
    );
    
    setExecution({
      ...execution,
      steps: updatedSteps
    });
  }, [execution, currentStep]);
  
  // Execution control functions
  const startExecution = useCallback(() => {
    if (!execution) return;
    
    setExecution({
      ...execution,
      status: 'running',
      startedAt: new Date().toISOString()
    });
  }, [execution]);
  
  const pauseExecution = useCallback(() => {
    if (!execution) return;
    
    setExecution({
      ...execution,
      status: 'paused'
    });
  }, [execution]);
  
  const resumeExecution = useCallback(() => {
    if (!execution) return;
    
    setExecution({
      ...execution,
      status: 'running'
    });
  }, [execution]);
  
  const resetExecution = useCallback(() => {
    if (!execution) return;
    
    const resetSteps = execution.steps.map(step => ({
      ...step,
      status: 'pending' as const,
      inputs: {},
      execution: undefined,
      notes: '',
      startedAt: undefined,
      completedAt: undefined
    }));
    
    setExecution({
      ...execution,
      steps: resetSteps,
      currentStepIndex: 0,
      status: 'pending',
      startedAt: undefined,
      completedAt: undefined
    });
  }, [execution]);
  
  // State management functions
  const saveState = useCallback(() => {
    if (execution) {
      saveExecutionState(execution);
    }
  }, [execution]);
  
  const loadState = useCallback((executionId: string): boolean => {
    const loadedExecution = loadExecutionState(executionId);
    if (loadedExecution) {
      setExecution(loadedExecution);
      return true;
    }
    return false;
  }, []);
  
  const clearState = useCallback(() => {
    if (execution) {
      clearExecutionState(execution.id);
      setExecution(null);
    }
  }, [execution]);
  
  // Variable carry-over functions
  const getAvailableVariables = useCallback((): Record<string, any> => {
    if (!execution || !enableCarryOver) return {};
    
    const variables: Record<string, any> = {};
    
    // Get variables from all completed steps
    execution.steps.forEach(step => {
      if (step.status === 'completed' && step.execution?.outputRaw) {
        const stepVariables = extractVariablesFromOutput(step.execution.outputRaw);
        Object.assign(variables, stepVariables);
      }
    });
    
    return variables;
  }, [execution, enableCarryOver]);
  
  const applyCarryOverVariables = useCallback(() => {
    if (!execution || !currentStep || !enableCarryOver) return;
    
    const availableVariables = getAvailableVariables();
    
    // Apply variables that match current step's variable definitions
    const template = templates.find(t => t.id === currentStep.templateId);
    if (!template) return;
    
    const newInputs = { ...currentStep.inputs };
    
    template.variableDefs.forEach(varDef => {
      if (availableVariables[varDef.name] !== undefined && !newInputs[varDef.name]) {
        newInputs[varDef.name] = availableVariables[varDef.name];
      }
    });
    
    updateStepInputs(newInputs);
  }, [execution, currentStep, enableCarryOver, getAvailableVariables, updateStepInputs, templates]);
  
  return {
    execution,
    currentStep,
    progress,
    isLoading,
    error,
    
    // Navigation
    canGoNext,
    canGoPrevious,
    goNext,
    goPrevious,
    goToStep,
    
    // Step management
    updateStepInputs,
    updateStepNotes,
    markStepCompleted,
    markStepSkipped,
    markStepFailed,
    
    // Execution control
    startExecution,
    pauseExecution,
    resumeExecution,
    resetExecution,
    
    // State management
    saveState,
    loadState,
    clearState,
    
    // Variable carry-over
    getAvailableVariables,
    applyCarryOverVariables
  };
}