import type { CollectionConfig } from 'payload'

export const Sessions: CollectionConfig = {
  slug: 'sessions',
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['project', 'user', 'currentStep', 'updatedAt'],
  },
  access: {
    read: ({ req: { user } }) => {
      if (user?.role === 'admin') return true
      return { user: { equals: user?.id } }
    },
    create: ({ req: { user } }) => !!user,
    update: ({ req: { user } }) => {
      if (user?.role === 'admin') return true
      return { user: { equals: user?.id } }
    },
  },
  fields: [
    {
      name: 'project',
      type: 'text',
      required: true,
      admin: {
        position: 'sidebar',
        description: 'Project ID reference',
      },
    },
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'currentStep',
      type: 'text',
      required: true,
      defaultValue: 'initial_concept',
      admin: {
        description: 'Current workflow step identifier',
      },
    },
    {
      name: 'conversationHistory',
      type: 'json',
      defaultValue: [],
      admin: {
        description: 'Array of chat messages and interactions',
      },
    },
    {
      name: 'contextData',
      type: 'json',
      defaultValue: {},
      admin: {
        description: 'Current context for LLM processing',
      },
    },
    {
      name: 'awaitingUserInput',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Whether system is waiting for user response',
      },
    },
    {
      name: 'lastChoices',
      type: 'json',
      admin: {
        description: 'Last set of choices presented to user',
      },
    },
    {
      name: 'sessionState',
      type: 'select',
      defaultValue: 'active',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Paused', value: 'paused' },
        { label: 'Completed', value: 'completed' },
        { label: 'Error', value: 'error' },
      ],
    },
  ],
  timestamps: true,
}