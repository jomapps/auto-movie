import type { CollectionConfig } from 'payload'

export const PromptsExecuted: CollectionConfig = {
  slug: 'prompts-executed',
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['status', 'model', 'app', 'stage', 'projectId', 'createdAt'],
    description: 'Execution records for audit',
  },
  fields: [
    {
      name: 'templateId',
      type: 'relationship',
      relationTo: 'prompt-templates',
      hasMany: false,
    },
    { name: 'app', type: 'text', required: true },
    { name: 'feature', type: 'text' },
    { name: 'stage', type: 'text', required: true },
    { name: 'projectId', type: 'text' },
    {
      name: 'tagsSnapshot',
      type: 'array',
      labels: { singular: 'Tag', plural: 'Tags' },
      fields: [{ name: 'value', type: 'text', required: true }],
    },
    { name: 'inputs', type: 'json', required: true, defaultValue: {} },
    { name: 'resolvedPrompt', type: 'textarea', required: true },
    {
      name: 'model',
      type: 'select',
      required: true,
      options: [
        { label: 'anthropic/claude-sonnet-4', value: 'anthropic/claude-sonnet-4' },
        { label: 'qwen/qwen3-vl-235b-a22b-thinking', value: 'qwen/qwen3-vl-235b-a22b-thinking' },
        { label: 'fal-ai/nano-banana', value: 'fal-ai/nano-banana' },
        { label: 'fal-ai/nano-banana/edit', value: 'fal-ai/nano-banana/edit' },
      ],
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      options: [
        { label: 'success', value: 'success' },
        { label: 'error', value: 'error' },
      ],
    },
    { name: 'outputRaw', type: 'json' },
    { name: 'errorMessage', type: 'textarea' },
    { name: 'startedAt', type: 'date' },
    { name: 'finishedAt', type: 'date' },
    { name: 'notes', type: 'textarea' },
  ],
}

export default PromptsExecuted

