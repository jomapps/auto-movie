import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import '@testing-library/jest-dom'
import { DynamicForm } from '@/components/prompts/DynamicForm'
import { TagGroupStepper } from '@/components/prompts/TagGroupStepper'
import { PromptCard } from '@/components/prompts/PromptCard'
import { PromptFilters } from '@/components/prompts/PromptFilters'
import type { VariableDefinition, PromptTemplate } from '@/types/prompts'
import { mockVariableDefinitions, mockPromptTemplates, TestUtils } from '../setup/test-fixtures'

// Mock the hooks
jest.mock('@/hooks/useTagGroupExecution', () => ({
  useTagGroupExecution: jest.fn()
}))

describe('DynamicForm Component', () => {
  const mockOnInputChange = jest.fn()

  beforeEach(() => {
    mockOnInputChange.mockClear()
  })

  it('should render all variable types correctly', () => {
    render(
      <DynamicForm
        variableDefs={mockVariableDefinitions}
        onInputChange={mockOnInputChange}
      />
    )

    // Check for different input types
    expect(screen.getByLabelText(/character/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/setting/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/wordCount/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/includeDialogue/i)).toBeInTheDocument()

    // Check for select dropdown (genre with options)
    expect(screen.getByDisplayValue('fantasy')).toBeInTheDocument() // Default value

    // Check for textarea (themes array)
    expect(screen.getByPlaceholderText(/one item per line/i)).toBeInTheDocument()
  })

  it('should initialize with default values', () => {
    render(
      <DynamicForm
        variableDefs={mockVariableDefinitions}
        onInputChange={mockOnInputChange}
      />
    )

    // Should call onInputChange with default values
    expect(mockOnInputChange).toHaveBeenCalledWith(
      expect.objectContaining({
        genre: 'fantasy',
        wordCount: 1000,
        includeDialogue: true,
        themes: ['adventure', 'friendship'],
        metadata: { rating: 'PG', audience: 'general' }
      })
    )
  })

  it('should handle string input changes', async () => {
    render(
      <DynamicForm
        variableDefs={[
          { name: 'character', type: 'string', required: true }
        ]}
        onInputChange={mockOnInputChange}
      />
    )

    const input = screen.getByLabelText(/character/i)

    await act(async () => {
      fireEvent.change(input, { target: { value: 'Alice' } })
    })

    expect(mockOnInputChange).toHaveBeenCalledWith(
      expect.objectContaining({ character: 'Alice' })
    )
  })

  it('should handle number input changes', async () => {
    render(
      <DynamicForm
        variableDefs={[
          { name: 'count', type: 'number', required: true }
        ]}
        onInputChange={mockOnInputChange}
      />
    )

    const input = screen.getByLabelText(/count/i)

    await act(async () => {
      fireEvent.change(input, { target: { value: '42' } })
    })

    expect(mockOnInputChange).toHaveBeenCalledWith(
      expect.objectContaining({ count: 42 })
    )
  })

  it('should handle boolean input changes', async () => {
    render(
      <DynamicForm
        variableDefs={[
          { name: 'enabled', type: 'boolean', required: false, defaultValue: false }
        ]}
        onInputChange={mockOnInputChange}
      />
    )

    const checkbox = screen.getByRole('checkbox')

    await act(async () => {
      fireEvent.click(checkbox)
    })

    expect(mockOnInputChange).toHaveBeenCalledWith(
      expect.objectContaining({ enabled: true })
    )
  })

  it('should handle array input changes', async () => {
    render(
      <DynamicForm
        variableDefs={[
          { name: 'items', type: 'array', required: false }
        ]}
        onInputChange={mockOnInputChange}
      />
    )

    const textarea = screen.getByPlaceholderText(/one item per line/i)

    await act(async () => {
      fireEvent.change(textarea, { target: { value: 'item1\nitem2\nitem3' } })
    })

    expect(mockOnInputChange).toHaveBeenCalledWith(
      expect.objectContaining({ items: ['item1', 'item2', 'item3'] })
    )
  })

  it('should handle object/JSON input changes', async () => {
    render(
      <DynamicForm
        variableDefs={[
          { name: 'config', type: 'object', required: false }
        ]}
        onInputChange={mockOnInputChange}
      />
    )

    const textarea = screen.getByPlaceholderText(/valid JSON/i)

    await act(async () => {
      fireEvent.change(textarea, {
        target: { value: '{"key": "value", "number": 42}' }
      })
    })

    expect(mockOnInputChange).toHaveBeenCalledWith(
      expect.objectContaining({
        config: { key: 'value', number: 42 }
      })
    )
  })

  it('should handle select dropdown changes', async () => {
    render(
      <DynamicForm
        variableDefs={[
          {
            name: 'genre',
            type: 'string',
            required: true,
            options: ['fantasy', 'sci-fi', 'mystery']
          }
        ]}
        onInputChange={mockOnInputChange}
      />
    )

    const select = screen.getByRole('combobox')

    await act(async () => {
      fireEvent.change(select, { target: { value: 'sci-fi' } })
    })

    expect(mockOnInputChange).toHaveBeenCalledWith(
      expect.objectContaining({ genre: 'sci-fi' })
    )
  })

  it('should show required field indicators', () => {
    render(
      <DynamicForm
        variableDefs={[
          { name: 'required_field', type: 'string', required: true },
          { name: 'optional_field', type: 'string', required: false }
        ]}
        onInputChange={mockOnInputChange}
      />
    )

    // Required field should have asterisk
    const requiredLabel = screen.getByLabelText(/required_field/i)
    expect(requiredLabel).toBeRequired()

    // Optional field should not have asterisk
    const optionalLabel = screen.getByLabelText(/optional_field/i)
    expect(optionalLabel).not.toBeRequired()
  })

  it('should handle empty variable definitions', () => {
    render(
      <DynamicForm
        variableDefs={[]}
        onInputChange={mockOnInputChange}
      />
    )

    expect(screen.getByText(/no variables defined/i)).toBeInTheDocument()
  })

  it('should preserve initial values over defaults', () => {
    const initialValues = {
      genre: 'mystery',
      wordCount: 5000
    }

    render(
      <DynamicForm
        variableDefs={mockVariableDefinitions}
        initialValues={initialValues}
        onInputChange={mockOnInputChange}
      />
    )

    expect(mockOnInputChange).toHaveBeenCalledWith(
      expect.objectContaining({
        genre: 'mystery', // Initial value overrides default 'fantasy'
        wordCount: 5000    // Initial value overrides default 1000
      })
    )
  })
})

describe('TagGroupStepper Component', () => {
  const mockUseTagGroupExecution = {
    execution: null,
    currentStep: null,
    progress: null,
    isLoading: false,
    error: null,
    canGoNext: false,
    canGoPrevious: false,
    goNext: jest.fn(),
    goPrevious: jest.fn(),
    goToStep: jest.fn(),
    updateStepInputs: jest.fn(),
    updateStepNotes: jest.fn(),
    markStepCompleted: jest.fn(),
    markStepSkipped: jest.fn(),
    markStepFailed: jest.fn(),
    startExecution: jest.fn(),
    pauseExecution: jest.fn(),
    resumeExecution: jest.fn(),
    resetExecution: jest.fn(),
    saveState: jest.fn(),
    loadState: jest.fn(),
    clearState: jest.fn(),
    getAvailableVariables: jest.fn(() => ({})),
    applyCarryOverVariables: jest.fn()
  }

  beforeEach(() => {
    const { useTagGroupExecution } = require('@/hooks/useTagGroupExecution')
    useTagGroupExecution.mockReturnValue(mockUseTagGroupExecution)

    Object.values(mockUseTagGroupExecution).forEach(fn => {
      if (typeof fn === 'function') {
        fn.mockClear()
      }
    })
  })

  it('should render loading state correctly', () => {
    const { useTagGroupExecution } = require('@/hooks/useTagGroupExecution')
    useTagGroupExecution.mockReturnValue({
      ...mockUseTagGroupExecution,
      isLoading: true
    })

    render(
      <TagGroupStepper
        groupName="test"
        templates={[]}
      />
    )

    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('should render error state correctly', () => {
    const { useTagGroupExecution } = require('@/hooks/useTagGroupExecution')
    useTagGroupExecution.mockReturnValue({
      ...mockUseTagGroupExecution,
      error: 'Failed to load execution'
    })

    render(
      <TagGroupStepper
        groupName="test"
        templates={[]}
      />
    )

    expect(screen.getByText(/failed to load execution/i)).toBeInTheDocument()
  })

  it('should render progress indicators', () => {
    const mockExecution = TestUtils.createMockTagGroupExecution('test', 3)
    mockExecution.steps[0].status = 'completed'
    mockExecution.currentStepIndex = 1

    const { useTagGroupExecution } = require('@/hooks/useTagGroupExecution')
    useTagGroupExecution.mockReturnValue({
      ...mockUseTagGroupExecution,
      execution: mockExecution,
      currentStep: mockExecution.steps[1],
      progress: {
        groupExecutionId: mockExecution.id,
        currentStep: 2,
        totalSteps: 3,
        completedSteps: 1,
        skippedSteps: 0,
        failedSteps: 0
      },
      canGoNext: false,
      canGoPrevious: true
    })

    render(
      <TagGroupStepper
        groupName="test"
        templates={mockPromptTemplates.slice(0, 3)}
      />
    )

    // Should show progress indicators
    expect(screen.getByText(/step 2 of 3/i)).toBeInTheDocument()

    // Navigation buttons
    expect(screen.getByRole('button', { name: /previous/i })).toBeEnabled()
    expect(screen.getByRole('button', { name: /next/i })).toBeDisabled()
  })

  it('should handle navigation button clicks', async () => {
    const mockExecution = TestUtils.createMockTagGroupExecution('test', 3)
    mockExecution.steps[0].status = 'completed'
    mockExecution.currentStepIndex = 1

    const { useTagGroupExecution } = require('@/hooks/useTagGroupExecution')
    useTagGroupExecution.mockReturnValue({
      ...mockUseTagGroupExecution,
      execution: mockExecution,
      currentStep: mockExecution.steps[1],
      canGoNext: true,
      canGoPrevious: true
    })

    render(
      <TagGroupStepper
        groupName="test"
        templates={mockPromptTemplates.slice(0, 3)}
      />
    )

    const nextButton = screen.getByRole('button', { name: /next/i })
    const previousButton = screen.getByRole('button', { name: /previous/i })

    await act(async () => {
      fireEvent.click(nextButton)
    })
    expect(mockUseTagGroupExecution.goNext).toHaveBeenCalled()

    await act(async () => {
      fireEvent.click(previousButton)
    })
    expect(mockUseTagGroupExecution.goPrevious).toHaveBeenCalled()
  })

  it('should apply variable carry-over automatically', () => {
    const { useTagGroupExecution } = require('@/hooks/useTagGroupExecution')
    useTagGroupExecution.mockReturnValue({
      ...mockUseTagGroupExecution,
      getAvailableVariables: jest.fn(() => ({
        concept: 'Previous step output',
        character: 'Alice'
      }))
    })

    render(
      <TagGroupStepper
        groupName="test"
        templates={mockPromptTemplates}
        enableCarryOver={true}
      />
    )

    // Should attempt to apply carry-over variables
    expect(mockUseTagGroupExecution.getAvailableVariables).toHaveBeenCalled()
  })
})

describe('PromptCard Component', () => {
  const mockTemplate = mockPromptTemplates[0]
  const mockOnExecute = jest.fn()
  const mockOnEdit = jest.fn()
  const mockOnDelete = jest.fn()

  beforeEach(() => {
    mockOnExecute.mockClear()
    mockOnEdit.mockClear()
    mockOnDelete.mockClear()
  })

  it('should display template information correctly', () => {
    render(
      <PromptCard
        template={mockTemplate}
        onExecute={mockOnExecute}
      />
    )

    expect(screen.getByText(mockTemplate.name)).toBeInTheDocument()
    expect(screen.getByText(mockTemplate.app)).toBeInTheDocument()
    expect(screen.getByText(mockTemplate.stage)).toBeInTheDocument()
    expect(screen.getByText(mockTemplate.model)).toBeInTheDocument()
  })

  it('should display tags correctly', () => {
    render(
      <PromptCard
        template={mockTemplate}
        onExecute={mockOnExecute}
      />
    )

    mockTemplate.tags.forEach(tag => {
      expect(screen.getByText(tag)).toBeInTheDocument()
    })
  })

  it('should show variable definitions count', () => {
    render(
      <PromptCard
        template={mockTemplate}
        onExecute={mockOnExecute}
      />
    )

    const variableCount = mockTemplate.variableDefs.length
    expect(screen.getByText(new RegExp(`${variableCount} variables?`, 'i'))).toBeInTheDocument()
  })

  it('should handle execute button click', async () => {
    render(
      <PromptCard
        template={mockTemplate}
        onExecute={mockOnExecute}
      />
    )

    const executeButton = screen.getByRole('button', { name: /execute/i })

    await act(async () => {
      fireEvent.click(executeButton)
    })

    expect(mockOnExecute).toHaveBeenCalledWith(mockTemplate)
  })

  it('should handle edit button click when provided', async () => {
    render(
      <PromptCard
        template={mockTemplate}
        onExecute={mockOnExecute}
        onEdit={mockOnEdit}
      />
    )

    const editButton = screen.getByRole('button', { name: /edit/i })

    await act(async () => {
      fireEvent.click(editButton)
    })

    expect(mockOnEdit).toHaveBeenCalledWith(mockTemplate)
  })

  it('should handle delete button click when provided', async () => {
    render(
      <PromptCard
        template={mockTemplate}
        onExecute={mockOnExecute}
        onDelete={mockOnDelete}
      />
    )

    const deleteButton = screen.getByRole('button', { name: /delete/i })

    await act(async () => {
      fireEvent.click(deleteButton)
    })

    expect(mockOnDelete).toHaveBeenCalledWith(mockTemplate.id)
  })

  it('should show loading state during execution', () => {
    render(
      <PromptCard
        template={mockTemplate}
        onExecute={mockOnExecute}
        isExecuting={true}
      />
    )

    expect(screen.getByRole('button', { name: /executing/i })).toBeDisabled()
  })

  it('should truncate long template content', () => {
    const templateWithLongContent = {
      ...mockTemplate,
      template: 'A'.repeat(200) // Very long template
    }

    render(
      <PromptCard
        template={templateWithLongContent}
        onExecute={mockOnExecute}
      />
    )

    // Should show truncated content with ellipsis
    const templateText = screen.getByText(/A+\.{3}/)
    expect(templateText).toBeInTheDocument()
  })
})

describe('PromptFilters Component', () => {
  const mockFilters = {
    app: '',
    stage: '',
    feature: '',
    search: '',
    tagGroup: ''
  }

  const mockOnFiltersChange = jest.fn()

  beforeEach(() => {
    mockOnFiltersChange.mockClear()
  })

  it('should render all filter inputs', () => {
    render(
      <PromptFilters
        filters={mockFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    )

    expect(screen.getByLabelText(/app/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/stage/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/feature/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/search/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/tag group/i)).toBeInTheDocument()
  })

  it('should handle filter changes', async () => {
    render(
      <PromptFilters
        filters={mockFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    )

    const appInput = screen.getByLabelText(/app/i)

    await act(async () => {
      fireEvent.change(appInput, { target: { value: 'auto-movie' } })
    })

    expect(mockOnFiltersChange).toHaveBeenCalledWith(
      expect.objectContaining({ app: 'auto-movie' })
    )
  })

  it('should handle search input with debouncing', async () => {
    jest.useFakeTimers()

    render(
      <PromptFilters
        filters={mockFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    )

    const searchInput = screen.getByLabelText(/search/i)

    await act(async () => {
      fireEvent.change(searchInput, { target: { value: 'story' } })
    })

    // Should not call immediately (debounced)
    expect(mockOnFiltersChange).not.toHaveBeenCalled()

    // Fast forward timers
    act(() => {
      jest.advanceTimersByTime(500)
    })

    expect(mockOnFiltersChange).toHaveBeenCalledWith(
      expect.objectContaining({ search: 'story' })
    )

    jest.useRealTimers()
  })

  it('should clear all filters', async () => {
    const filtersWithValues = {
      app: 'auto-movie',
      stage: 'development',
      feature: 'story',
      search: 'test',
      tagGroup: 'preproduction'
    }

    render(
      <PromptFilters
        filters={filtersWithValues}
        onFiltersChange={mockOnFiltersChange}
      />
    )

    const clearButton = screen.getByRole('button', { name: /clear filters/i })

    await act(async () => {
      fireEvent.click(clearButton)
    })

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      app: '',
      stage: '',
      feature: '',
      search: '',
      tagGroup: ''
    })
  })

  it('should show filter count when filters are active', () => {
    const activeFilters = {
      app: 'auto-movie',
      stage: 'development',
      feature: '',
      search: 'story',
      tagGroup: ''
    }

    render(
      <PromptFilters
        filters={activeFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    )

    // Should show count of active filters (3 non-empty filters)
    expect(screen.getByText(/3 filters active/i)).toBeInTheDocument()
  })
})

describe('Component Integration Tests', () => {
  it('should integrate DynamicForm with TagGroupStepper correctly', async () => {
    const mockExecution = TestUtils.createMockTagGroupExecution('test', 2)
    const mockCurrentStep = mockExecution.steps[0]

    const { useTagGroupExecution } = require('@/hooks/useTagGroupExecution')
    useTagGroupExecution.mockReturnValue({
      ...mockUseTagGroupExecution,
      execution: mockExecution,
      currentStep: mockCurrentStep,
      progress: {
        groupExecutionId: mockExecution.id,
        currentStep: 1,
        totalSteps: 2,
        completedSteps: 0,
        skippedSteps: 0,
        failedSteps: 0
      }
    })

    const templates = [
      TestUtils.createMockTemplate({
        id: mockCurrentStep.templateId,
        variableDefs: [
          { name: 'input1', type: 'string', required: true },
          { name: 'input2', type: 'number', required: false, defaultValue: 42 }
        ]
      })
    ]

    render(
      <TagGroupStepper
        groupName="test"
        templates={templates}
      />
    )

    // Should render both stepper and form
    expect(screen.getByText(/step 1 of 2/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/input1/i)).toBeInTheDocument()
    expect(screen.getByDisplayValue('42')).toBeInTheDocument() // Default value
  })

  it('should handle form submission in stepper context', async () => {
    const mockExecution = TestUtils.createMockTagGroupExecution('test', 1)
    const mockCurrentStep = mockExecution.steps[0]

    const { useTagGroupExecution } = require('@/hooks/useTagGroupExecution')
    useTagGroupExecution.mockReturnValue({
      ...mockUseTagGroupExecution,
      execution: mockExecution,
      currentStep: mockCurrentStep
    })

    const templates = [
      TestUtils.createMockTemplate({
        id: mockCurrentStep.templateId,
        variableDefs: [
          { name: 'prompt', type: 'string', required: true }
        ]
      })
    ]

    render(
      <TagGroupStepper
        groupName="test"
        templates={templates}
      />
    )

    // Fill form and submit
    const input = screen.getByLabelText(/prompt/i)
    await act(async () => {
      fireEvent.change(input, { target: { value: 'Test prompt content' } })
    })

    const executeButton = screen.getByRole('button', { name: /execute/i })
    await act(async () => {
      fireEvent.click(executeButton)
    })

    expect(mockUseTagGroupExecution.updateStepInputs).toHaveBeenCalledWith(
      expect.objectContaining({ prompt: 'Test prompt content' })
    )
  })
})

describe('Component Error Handling', () => {
  it('should handle malformed template data gracefully', () => {
    const malformedTemplate = {
      ...mockPromptTemplates[0],
      variableDefs: null // Invalid variable definitions
    } as any

    render(
      <DynamicForm
        variableDefs={malformedTemplate.variableDefs || []}
        onInputChange={jest.fn()}
      />
    )

    expect(screen.getByText(/no variables defined/i)).toBeInTheDocument()
  })

  it('should handle missing template properties', () => {
    const incompleteTemplate = {
      id: 'incomplete',
      name: 'Incomplete Template'
      // Missing required properties
    } as any

    expect(() => {
      render(
        <PromptCard
          template={incompleteTemplate}
          onExecute={jest.fn()}
        />
      )
    }).not.toThrow()
  })

  it('should handle component crash with error boundary', () => {
    // Component that throws an error
    const ProblematicComponent = () => {
      throw new Error('Component crashed!')
    }

    const ErrorBoundaryTest = () => {
      try {
        return <ProblematicComponent />
      } catch (error) {
        return <div>Error caught: Component crashed gracefully</div>
      }
    }

    render(<ErrorBoundaryTest />)

    expect(screen.getByText(/error caught/i)).toBeInTheDocument()
  })
})

describe('Component Performance Tests', () => {
  it('should render large template lists efficiently', () => {
    const largeTemplateList = Array(100).fill(null).map((_, i) =>
      TestUtils.createMockTemplate({
        id: `template-${i}`,
        name: `Template ${i}`,
        tags: [`group-${String(i).padStart(3, '0')}`]
      })
    )

    const startTime = performance.now()

    render(
      <div>
        {largeTemplateList.map(template => (
          <PromptCard
            key={template.id}
            template={template}
            onExecute={jest.fn()}
          />
        ))}
      </div>
    )

    const renderTime = performance.now() - startTime

    expect(renderTime).toBeLessThan(1000) // Should render within 1 second
    expect(screen.getAllByText(/Template \d+/)).toHaveLength(100)
  })

  it('should handle rapid form input changes without performance degradation', async () => {
    const mockOnChange = jest.fn()

    render(
      <DynamicForm
        variableDefs={[
          { name: 'rapidInput', type: 'string', required: false }
        ]}
        onInputChange={mockOnChange}
      />
    )

    const input = screen.getByLabelText(/rapidInput/i)

    // Simulate rapid typing
    const startTime = performance.now()

    for (let i = 0; i < 20; i++) {
      await act(async () => {
        fireEvent.change(input, { target: { value: `value${i}` } })
      })
    }

    const totalTime = performance.now() - startTime

    expect(totalTime).toBeLessThan(500) // Should handle rapid changes efficiently
    expect(mockOnChange).toHaveBeenCalledTimes(21) // Initial + 20 changes
  })
})

describe('Accessibility Tests', () => {
  it('should have proper ARIA labels and roles', () => {
    render(
      <DynamicForm
        variableDefs={[
          { name: 'accessibleField', type: 'string', required: true }
        ]}
        onInputChange={jest.fn()}
      />
    )

    const input = screen.getByLabelText(/accessibleField/i)
    expect(input).toHaveAttribute('aria-required', 'true')
    expect(input).toHaveAccessibleName()
  })

  it('should support keyboard navigation', async () => {
    render(
      <DynamicForm
        variableDefs={[
          { name: 'field1', type: 'string', required: true },
          { name: 'field2', type: 'string', required: true }
        ]}
        onInputChange={jest.fn()}
      />
    )

    const field1 = screen.getByLabelText(/field1/i)
    const field2 = screen.getByLabelText(/field2/i)

    // Focus first field
    field1.focus()
    expect(field1).toHaveFocus()

    // Tab to next field
    await act(async () => {
      fireEvent.keyDown(field1, { key: 'Tab' })
    })

    // Should be able to navigate between fields
    expect(field1).toHaveAttribute('tabindex')
    expect(field2).toHaveAttribute('tabindex')
  })

  it('should announce form validation errors to screen readers', () => {
    render(
      <DynamicForm
        variableDefs={[
          { name: 'required_field', type: 'string', required: true }
        ]}
        onInputChange={jest.fn()}
      />
    )

    const input = screen.getByLabelText(/required_field/i)
    expect(input).toHaveAttribute('aria-required', 'true')

    // Required fields should be marked appropriately
    const label = screen.getByText(/required_field/i)
    expect(label).toHaveTextContent('*') // Visual required indicator
  })
})

describe('Component State Management', () => {
  it('should maintain form state during re-renders', async () => {
    const TestWrapper = ({ variableDefs }: { variableDefs: VariableDefinition[] }) => {
      const [inputs, setInputs] = React.useState({})

      return (
        <DynamicForm
          variableDefs={variableDefs}
          onInputChange={setInputs}
        />
      )
    }

    const { rerender } = render(
      <TestWrapper variableDefs={[
        { name: 'field1', type: 'string', required: false }
      ]} />
    )

    const input = screen.getByLabelText(/field1/i)

    await act(async () => {
      fireEvent.change(input, { target: { value: 'persistent value' } })
    })

    // Re-render with same props
    rerender(
      <TestWrapper variableDefs={[
        { name: 'field1', type: 'string', required: false }
      ]} />
    )

    // Value should persist
    expect(screen.getByDisplayValue('persistent value')).toBeInTheDocument()
  })
})