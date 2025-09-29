'use client';

import React, { useState, useEffect } from 'react';
import { PromptTemplate, PromptExecution } from '@/types/prompts';
import { DynamicForm } from '@/components/prompts/DynamicForm';
import {
  TagGroupExecution,
  TagGroupStep,
  TagGroupProgress,
  generateExecutionSummary
} from '@/lib/prompts/tag-utils';
import { UseTagGroupExecutionReturn } from '@/hooks/useTagGroupExecution';

interface TagGroupStepperProps {
  templates: PromptTemplate[];
  execution: UseTagGroupExecutionReturn;
  onExecuteStep?: (templateId: string, inputs: Record<string, any>) => Promise<PromptExecution>;
  onExportResults?: () => void;
  className?: string;
}

export function TagGroupStepper({
  templates,
  execution,
  onExecuteStep,
  onExportResults,
  className = ''
}: TagGroupStepperProps) {
  const [isExecuting, setIsExecuting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [resolvedPrompt, setResolvedPrompt] = useState('');
  
  const {
    execution: tagGroupExecution,
    currentStep,
    progress,
    canGoNext,
    canGoPrevious,
    goNext,
    goPrevious,
    goToStep,
    updateStepInputs,
    updateStepNotes,
    markStepCompleted,
    markStepSkipped,
    markStepFailed,
    applyCarryOverVariables,
    getAvailableVariables
  } = execution;
  
  const currentTemplate = currentStep ? templates.find(t => t.id === currentStep.templateId) : null;
  
  // Auto-apply carry-over variables when step changes
  useEffect(() => {
    if (currentStep && currentStep.status === 'pending') {
      applyCarryOverVariables();
    }
  }, [currentStep?.id, applyCarryOverVariables]);
  
  // Generate resolved prompt preview
  useEffect(() => {
    if (currentTemplate && currentStep) {
      let prompt = currentTemplate.template;
      
      // Replace variables with current inputs
      Object.entries(currentStep.inputs).forEach(([key, value]) => {
        const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
        prompt = prompt.replace(regex, String(value || `{{${key}}}`));
      });
      
      setResolvedPrompt(prompt);
    }
  }, [currentTemplate, currentStep?.inputs]);
  
  const handleExecuteStep = async () => {
    if (!currentStep || !currentTemplate || !onExecuteStep) return;
    
    setIsExecuting(true);
    try {
      const result = await onExecuteStep(currentTemplate.id, currentStep.inputs);
      markStepCompleted(result);
      
      // Auto-advance to next step if available
      setTimeout(() => {
        if (canGoNext) {
          goNext();
        }
      }, 1000);
    } catch (error) {
      markStepFailed(error instanceof Error ? error.message : 'Execution failed');
    } finally {
      setIsExecuting(false);
    }
  };
  
  const handleSkipStep = () => {
    markStepSkipped();
    if (canGoNext) {
      goNext();
    }
  };
  
  const handleStepClick = (stepIndex: number) => {
    // Only allow navigation to completed or current steps
    if (tagGroupExecution) {
      const step = tagGroupExecution.steps[stepIndex];
      if (step.status === 'completed' || step.status === 'skipped' || stepIndex <= tagGroupExecution.currentStepIndex) {
        goToStep(stepIndex);
      }
    }
  };
  
  const getStepIcon = (step: TagGroupStep, index: number) => {
    const isCurrent = tagGroupExecution?.currentStepIndex === index;
    
    switch (step.status) {
      case 'completed':
        return (
          <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
            ✓
          </div>
        );
      case 'skipped':
        return (
          <div className="w-8 h-8 bg-yellow-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
            ⤴
          </div>
        );
      case 'failed':
        return (
          <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
            ✗
          </div>
        );
      case 'running':
        return (
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
        );
      default:
        return (
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
            isCurrent 
              ? 'bg-purple-600 text-white' 
              : 'bg-slate-700 text-slate-400'
          }`}>
            {index + 1}
          </div>
        );
    }
  };
  
  const getStepLineColor = (step: TagGroupStep) => {
    switch (step.status) {
      case 'completed':
        return 'bg-green-600';
      case 'skipped':
        return 'bg-yellow-600';
      case 'failed':
        return 'bg-red-600';
      default:
        return 'bg-slate-700';
    }
  };
  
  if (!tagGroupExecution || !progress) {
    return (
      <div className={`bg-slate-800 rounded-lg p-6 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading tag group execution...</p>
        </div>
      </div>
    );
  }
  
  // Show completion summary
  if (tagGroupExecution.status === 'completed') {
    const summary = generateExecutionSummary(tagGroupExecution);
    
    return (
      <div className={`bg-slate-800 rounded-lg p-6 ${className}`}>
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
            ✓
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Execution Completed!</h2>
          <p className="text-slate-400">{summary.summary}</p>
        </div>
        
        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-slate-700 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-white">{summary.statistics.completed}</div>
            <div className="text-sm text-slate-400">Completed</div>
          </div>
          <div className="bg-slate-700 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-yellow-400">{summary.statistics.skipped}</div>
            <div className="text-sm text-slate-400">Skipped</div>
          </div>
          <div className="bg-slate-700 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-red-400">{summary.statistics.failed}</div>
            <div className="text-sm text-slate-400">Failed</div>
          </div>
          <div className="bg-slate-700 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-400">{summary.statistics.successRate.toFixed(1)}%</div>
            <div className="text-sm text-slate-400">Success Rate</div>
          </div>
        </div>
        
        {/* Results List */}
        <div className="bg-slate-900 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-white mb-4">Execution Results</h3>
          <div className="space-y-2">
            {summary.results.map((result, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-slate-800 rounded">
                <div className="flex items-center space-x-3">
                  <span className={`w-3 h-3 rounded-full ${
                    result.status === 'completed' ? 'bg-green-500' :
                    result.status === 'skipped' ? 'bg-yellow-500' :
                    result.status === 'failed' ? 'bg-red-500' : 'bg-slate-500'
                  }`}></span>
                  <span className="text-white font-medium">{result.stepName}</span>
                </div>
                <div className="flex items-center space-x-4 text-sm text-slate-400">
                  {result.executionTime && (
                    <span>{(result.executionTime / 1000).toFixed(2)}s</span>
                  )}
                  {result.hasOutput && (
                    <span className="text-green-400">Has Output</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex justify-center space-x-4">
          {onExportResults && (
            <button
              onClick={onExportResults}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              Export Results
            </button>
          )}
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors"
          >
            Start New Execution
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`bg-slate-800 rounded-lg ${className}`}>
      {/* Progress Header */}
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">
            {tagGroupExecution.groupName} Execution
          </h2>
          <div className="text-sm text-slate-400">
            Step {progress.currentStep} of {progress.totalSteps}
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-slate-700 rounded-full h-2 mb-4">
          <div
            className="bg-purple-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(progress.completedSteps / progress.totalSteps) * 100}%` }}
          ></div>
        </div>
        
        {/* Step Indicators */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-2">
          {tagGroupExecution.steps.map((step, index) => (
            <div key={step.id} className="flex items-center flex-shrink-0">
              <button
                onClick={() => handleStepClick(index)}
                className={`flex flex-col items-center space-y-1 p-2 rounded-lg transition-colors ${
                  step.status === 'completed' || step.status === 'skipped' || index <= tagGroupExecution.currentStepIndex
                    ? 'hover:bg-slate-700 cursor-pointer'
                    : 'cursor-not-allowed opacity-50'
                }`}
                disabled={step.status === 'pending' && index > tagGroupExecution.currentStepIndex}
              >
                {getStepIcon(step, index)}
                <span className="text-xs text-slate-400 max-w-16 truncate">
                  {step.templateName}
                </span>
              </button>
              
              {/* Connector Line */}
              {index < tagGroupExecution.steps.length - 1 && (
                <div className={`w-8 h-0.5 mx-1 ${getStepLineColor(step)}`}></div>
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* Current Step Content */}
      {currentStep && currentTemplate && (
        <div className="p-6">
          {/* Step Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-white">{currentTemplate.name}</h3>
              <p className="text-sm text-slate-400">{currentTemplate.feature}</p>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                currentStep.status === 'completed' ? 'bg-green-600 text-white' :
                currentStep.status === 'skipped' ? 'bg-yellow-600 text-white' :
                currentStep.status === 'failed' ? 'bg-red-600 text-white' :
                currentStep.status === 'running' ? 'bg-blue-600 text-white' :
                'bg-slate-600 text-slate-300'
              }`}>
                {currentStep.status.charAt(0).toUpperCase() + currentStep.status.slice(1)}
              </span>
            </div>
          </div>
          
          {/* Variable Carry-Over Info */}
          {Object.keys(getAvailableVariables()).length > 0 && (
            <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-2 mb-2">
                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-medium text-blue-400">Variables Available from Previous Steps</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {Object.keys(getAvailableVariables()).map(varName => (
                  <span key={varName} className="px-2 py-1 bg-blue-800 text-blue-200 text-xs rounded">
                    {varName}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {/* Input Form */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className="text-md font-semibold text-white mb-4">Template Variables</h4>
              <DynamicForm
                variableDefs={currentTemplate.variableDefs}
                initialValues={currentStep.inputs}
                onInputChange={updateStepInputs}
              />
              
              {/* Notes */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Step Notes
                </label>
                <textarea
                  value={currentStep.notes || ''}
                  onChange={(e) => updateStepNotes(e.target.value)}
                  placeholder="Add notes about this step..."
                  className="w-full h-24 bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  disabled={currentStep.status === 'completed' || currentStep.status === 'skipped'}
                />
              </div>
            </div>
            
            <div>
              {/* Preview Toggle */}
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-md font-semibold text-white">Prompt Preview</h4>
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
                >
                  {showPreview ? 'Hide' : 'Show'} Preview
                </button>
              </div>
              
              {/* Resolved Prompt */}
              {showPreview && (
                <div className="bg-slate-900 border border-slate-600 rounded-lg p-4 h-64 overflow-y-auto">
                  <pre className="text-sm text-slate-300 whitespace-pre-wrap">
                    {resolvedPrompt}
                  </pre>
                </div>
              )}
              
              {/* Execution Result */}
              {currentStep.execution && (
                <div className="mt-4">
                  <h5 className="text-sm font-medium text-slate-300 mb-2">Execution Result</h5>
                  <div className="bg-slate-900 border border-slate-600 rounded-lg p-4 max-h-64 overflow-y-auto">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-xs font-medium ${
                        currentStep.execution.status === 'completed' ? 'text-green-400' :
                        currentStep.execution.status === 'failed' ? 'text-red-400' :
                        'text-yellow-400'
                      }`}>
                        {currentStep.execution.status.toUpperCase()}
                      </span>
                      {currentStep.execution.executionTime && (
                        <span className="text-xs text-slate-400">
                          {(currentStep.execution.executionTime / 1000).toFixed(2)}s
                        </span>
                      )}
                    </div>
                    <pre className="text-sm text-slate-300 whitespace-pre-wrap">
                      {currentStep.execution.outputRaw || currentStep.execution.errorMessage}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-700">
            <div className="flex items-center space-x-3">
              <button
                onClick={goPrevious}
                disabled={!canGoPrevious}
                className="px-4 py-2 bg-slate-600 hover:bg-slate-700 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-lg transition-colors"
              >
                ← Previous
              </button>
              
              {currentStep.status === 'pending' && (
                <>
                  <button
                    onClick={handleSkipStep}
                    className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors"
                  >
                    Skip Step
                  </button>
                  
                  <button
                    onClick={handleExecuteStep}
                    disabled={isExecuting || !onExecuteStep}
                    className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 disabled:text-purple-300 text-white rounded-lg transition-colors flex items-center space-x-2"
                  >
                    {isExecuting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Executing...</span>
                      </>
                    ) : (
                      <span>Execute Step</span>
                    )}
                  </button>
                </>
              )}
              
              {(currentStep.status === 'completed' || currentStep.status === 'skipped') && (
                <button
                  onClick={goNext}
                  disabled={!canGoNext}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-lg transition-colors"
                >
                  Next →
                </button>
              )}
            </div>
            
            <div className="text-sm text-slate-400">
              {progress.completedSteps} completed, {progress.skippedSteps} skipped, {progress.failedSteps} failed
            </div>
          </div>
        </div>
      )}
    </div>
  );
}