import type { CollectionConfig } from 'payload'

export const PromptTemplates: CollectionConfig = {
  slug: 'prompt-templates',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'app', 'stage', 'model', 'updatedAt'],
  },
  versions: true,
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'app', type: 'text', required: true },
    { name: 'feature', type: 'text' },
    { name: 'stage', type: 'text', required: true },
    {
      name: 'tags',
      type: 'array',
      labels: { singular: 'Tag', plural: 'Tags' },
      fields: [{ name: 'value', type: 'text', required: true }],
    },
    {
      name: 'template',
      type: 'textarea',
      required: true,
      admin: { description: 'Template with placeholders like {{variableName}}' },
    },
    {
      name: 'variableDefs',
      type: 'array',
      required: true,
      labels: { singular: 'Variable', plural: 'Variables' },
      fields: [
        { name: 'name', type: 'text', required: true },
        {
          name: 'type',
          type: 'select',
          required: true,
          options: [
            { label: 'string', value: 'string' },
            { label: 'number', value: 'number' },
            { label: 'boolean', value: 'boolean' },
            { label: 'json', value: 'json' },
            { label: 'text', value: 'text' },
            { label: 'url', value: 'url' },
          ],
        },
        { name: 'required', type: 'checkbox', defaultValue: true },
        { name: 'description', type: 'textarea' },
        { name: 'defaultValue', type: 'json' },
      ],
    },
    { name: 'outputSchema', type: 'json' },
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
    { name: 'notes', type: 'textarea' },
  ],
}

export default PromptTemplates

