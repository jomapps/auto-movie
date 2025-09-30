import type { CollectionConfig } from 'payload'

export const Tasks: CollectionConfig = {
  slug: 'tasks',
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['taskType', 'status', 'priority', 'project', 'createdAt'],
    group: 'Production',
  },
  access: {
    read: ({ req: { user } }) => {
      if (user?.role === 'admin') return true
      return Boolean(user)
    },
    create: ({ req: { user } }) => !!user,
    update: ({ req: { user } }) => {
      if (user?.role === 'admin') return true
      return Boolean(user)
    },
  },
  fields: [
    {
      name: 'taskType',
      type: 'select',
      required: true,
      options: [
        { label: 'Image Generation', value: 'image_generation' },
        { label: 'Video Generation', value: 'video_generation' },
        { label: 'Audio Generation', value: 'audio_generation' },
        { label: 'Script Generation', value: 'script_generation' },
        { label: 'Embedding Generation', value: 'embedding_generation' },
        { label: 'Scene Assembly', value: 'scene_assembly' },
      ],
      admin: {
        description: 'Type of task to be executed',
      },
    },
    {
      name: 'project',
      type: 'relationship',
      relationTo: 'projects',
      required: true,
      hasMany: false,
      admin: {
        position: 'sidebar',
        description: 'Project this task belongs to',
      },
    },
    {
      name: 'episode',
      type: 'relationship',
      relationTo: 'episodes',
      hasMany: false,
      admin: {
        position: 'sidebar',
        description: 'Related episode (if applicable)',
      },
    },
    {
      name: 'scene',
      type: 'relationship',
      relationTo: 'scenes',
      hasMany: false,
      admin: {
        position: 'sidebar',
        description: 'Related scene (if applicable)',
      },
    },
    {
      name: 'character',
      type: 'relationship',
      relationTo: 'characters',
      hasMany: false,
      admin: {
        position: 'sidebar',
        description: 'Related character (if applicable)',
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'queued',
      options: [
        { label: 'Queued', value: 'queued' },
        { label: 'Processing', value: 'processing' },
        { label: 'Completed', value: 'completed' },
        { label: 'Failed', value: 'failed' },
        { label: 'Cancelled', value: 'cancelled' },
      ],
      admin: {
        description: 'Current task status',
      },
    },
    {
      name: 'priority',
      type: 'number',
      required: true,
      defaultValue: 5,
      min: 1,
      max: 10,
      admin: {
        description: 'Task priority (1=lowest, 10=highest)',
      },
    },
    {
      name: 'input',
      type: 'group',
      fields: [
        {
          name: 'prompt',
          type: 'relationship',
          relationTo: 'prompts-executed',
          admin: {
            description: 'Prompt execution record for this task',
          },
        },
        {
          name: 'parameters',
          type: 'json',
          defaultValue: {},
          admin: {
            description: 'Task-specific input parameters',
          },
        },
        {
          name: 'dependencies',
          type: 'relationship',
          relationTo: 'tasks',
          hasMany: true,
          admin: {
            description: 'Tasks that must complete before this one',
          },
        },
      ],
    },
    {
      name: 'output',
      type: 'group',
      fields: [
        {
          name: 'media',
          type: 'relationship',
          relationTo: 'media',
          admin: {
            description: 'Generated media asset',
          },
        },
        {
          name: 'result',
          type: 'json',
          admin: {
            description: 'Task result data',
          },
        },
        {
          name: 'metrics',
          type: 'group',
          fields: [
            {
              name: 'processingTime',
              type: 'number',
              admin: {
                description: 'Processing time in seconds',
                readOnly: true,
              },
            },
            {
              name: 'cost',
              type: 'number',
              admin: {
                description: 'Cost in credits or currency',
                readOnly: true,
              },
            },
            {
              name: 'tokensUsed',
              type: 'number',
              admin: {
                description: 'AI tokens consumed',
                readOnly: true,
              },
            },
          ],
        },
      ],
    },
    {
      name: 'progress',
      type: 'group',
      fields: [
        {
          name: 'percentage',
          type: 'number',
          min: 0,
          max: 100,
          defaultValue: 0,
          admin: {
            description: 'Progress percentage',
            readOnly: true,
          },
        },
        {
          name: 'currentStep',
          type: 'text',
          admin: {
            description: 'Current processing step',
            readOnly: true,
          },
        },
        {
          name: 'estimatedCompletion',
          type: 'date',
          admin: {
            description: 'Estimated completion time',
            readOnly: true,
          },
        },
      ],
    },
    {
      name: 'error',
      type: 'group',
      admin: {
        condition: data => data.status === 'failed',
      },
      fields: [
        {
          name: 'message',
          type: 'textarea',
          admin: {
            description: 'Error message',
          },
        },
        {
          name: 'code',
          type: 'text',
          admin: {
            description: 'Error code',
          },
        },
        {
          name: 'retryCount',
          type: 'number',
          defaultValue: 0,
          admin: {
            description: 'Number of retry attempts',
          },
        },
        {
          name: 'lastRetry',
          type: 'date',
          admin: {
            description: 'Timestamp of last retry',
          },
        },
      ],
    },
    {
      name: 'worker',
      type: 'group',
      admin: {
        condition: data => data.status === 'processing',
      },
      fields: [
        {
          name: 'workerId',
          type: 'text',
          admin: {
            description: 'ID of the worker processing this task',
            readOnly: true,
          },
        },
        {
          name: 'startedAt',
          type: 'date',
          admin: {
            description: 'When processing started',
            readOnly: true,
          },
        },
        {
          name: 'heartbeat',
          type: 'date',
          admin: {
            description: 'Last heartbeat from worker',
            readOnly: true,
          },
        },
      ],
    },
    {
      name: 'completedAt',
      type: 'date',
      admin: {
        condition: data => ['completed', 'failed', 'cancelled'].includes(data.status),
        readOnly: true,
      },
    },
  ],
  hooks: {
    beforeChange: [
      ({ data, operation }) => {
        // Set completedAt when task finishes
        if (['completed', 'failed', 'cancelled'].includes(data.status) && !data.completedAt) {
          data.completedAt = new Date()
        }

        // Set startedAt when processing begins
        if (data.status === 'processing' && !data.worker?.startedAt) {
          if (!data.worker) data.worker = {}
          data.worker.startedAt = new Date()
        }

        return data
      },
    ],
  },
  timestamps: true,
}