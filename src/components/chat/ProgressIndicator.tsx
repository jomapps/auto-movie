'use client'

interface ProgressStep {
  id: string
  title: string
  description?: string
  completed: boolean
  current: boolean
}

interface ProgressIndicatorProps {
  currentStep?: string
  progress?: number
  totalSteps?: number
  steps?: ProgressStep[]
}

export default function ProgressIndicator({ 
  currentStep, 
  progress = 0, 
  totalSteps = 10,
  steps
}: ProgressIndicatorProps) {
  // Default workflow steps if none provided
  const defaultSteps: ProgressStep[] = [
    { id: 'concept', title: 'Concept Development', completed: progress >= 10, current: currentStep === 'concept' },
    { id: 'story', title: 'Story Structure', completed: progress >= 20, current: currentStep === 'story' },
    { id: 'characters', title: 'Character Design', completed: progress >= 30, current: currentStep === 'characters' },
    { id: 'storyboard', title: 'Storyboarding', completed: progress >= 40, current: currentStep === 'storyboard' },
    { id: 'assets', title: 'Asset Creation', completed: progress >= 50, current: currentStep === 'assets' },
    { id: 'scenes', title: 'Scene Planning', completed: progress >= 60, current: currentStep === 'scenes' },
    { id: 'production', title: 'Production', completed: progress >= 70, current: currentStep === 'production' },
    { id: 'editing', title: 'Editing', completed: progress >= 80, current: currentStep === 'editing' },
    { id: 'review', title: 'Review & Polish', completed: progress >= 90, current: currentStep === 'review' },
    { id: 'final', title: 'Final Output', completed: progress >= 100, current: currentStep === 'final' }
  ]

  const workflowSteps = steps || defaultSteps
  const currentStepIndex = workflowSteps.findIndex(step => step.current)
  const completedSteps = workflowSteps.filter(step => step.completed).length

  return (
    <div className="space-y-4">
      {/* Overall Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-300 font-medium">Project Progress</span>
          <div className="flex items-center gap-2">
            <span className="text-white font-semibold">{progress}%</span>
            <span className="text-slate-400">
              ({completedSteps}/{workflowSteps.length} steps)
            </span>
          </div>
        </div>
        
        <div className="w-full bg-slate-700 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-purple-600 to-purple-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Current Step Indicator */}
      {currentStep && (
        <div className="bg-slate-800/50 rounded-lg p-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="text-white font-medium">
                Current: {workflowSteps.find(s => s.current)?.title || currentStep}
              </div>
              <div className="text-slate-400 text-sm">
                {workflowSteps.find(s => s.current)?.description || 'Working on this step...'}
              </div>
            </div>
            <div className="text-purple-400 text-sm font-medium">
              Step {(currentStepIndex + 1) || '?'} of {workflowSteps.length}
            </div>
          </div>
        </div>
      )}

      {/* Step Timeline */}
      <div className="bg-slate-800/30 rounded-lg p-4">
        <h4 className="text-white font-medium mb-3">Workflow Timeline</h4>
        
        <div className="space-y-2">
          {workflowSteps.map((step, index) => (
            <div key={step.id} className="flex items-center gap-3">
              {/* Step Indicator */}
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                step.completed 
                  ? 'bg-green-600 text-white' 
                  : step.current 
                    ? 'bg-purple-600 text-white animate-pulse' 
                    : 'bg-slate-600 text-slate-400'
              }`}>
                {step.completed ? (
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  index + 1
                )}
              </div>

              {/* Step Content */}
              <div className="flex-1 min-w-0">
                <div className={`font-medium ${
                  step.completed 
                    ? 'text-green-400' 
                    : step.current 
                      ? 'text-white' 
                      : 'text-slate-500'
                }`}>
                  {step.title}
                </div>
                {step.description && (
                  <div className="text-slate-400 text-xs truncate">
                    {step.description}
                  </div>
                )}
              </div>

              {/* Status Badge */}
              <div className="text-xs">
                {step.completed && (
                  <span className="bg-green-600/20 text-green-400 px-2 py-1 rounded">
                    Done
                  </span>
                )}
                {step.current && !step.completed && (
                  <span className="bg-purple-600/20 text-purple-400 px-2 py-1 rounded">
                    Active
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Next Up Preview */}
        {currentStepIndex >= 0 && currentStepIndex < workflowSteps.length - 1 && (
          <div className="mt-4 pt-4 border-t border-slate-700">
            <div className="text-slate-400 text-sm mb-1">Coming Next:</div>
            <div className="text-white text-sm font-medium">
              {workflowSteps[currentStepIndex + 1]?.title}
            </div>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="bg-slate-800/50 rounded-lg p-3">
          <div className="text-green-400 text-lg font-bold">{completedSteps}</div>
          <div className="text-slate-400 text-xs">Completed</div>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-3">
          <div className="text-purple-400 text-lg font-bold">
            {currentStepIndex >= 0 ? 1 : 0}
          </div>
          <div className="text-slate-400 text-xs">In Progress</div>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-3">
          <div className="text-slate-400 text-lg font-bold">
            {workflowSteps.length - completedSteps - (currentStepIndex >= 0 ? 1 : 0)}
          </div>
          <div className="text-slate-400 text-xs">Remaining</div>
        </div>
      </div>
    </div>
  )
}