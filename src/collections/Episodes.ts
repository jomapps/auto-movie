import type { CollectionConfig } from 'payload'

export const Episodes: CollectionConfig = {
  slug: 'episodes',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['episodeNumber', 'title', 'project', 'status', 'updatedAt'],
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
      name: 'project',
      type: 'relationship',
      relationTo: 'projects',
      required: true,
      hasMany: false,
      admin: {
        position: 'sidebar',
        description: 'Parent project for this episode',
      },
    },
    {
      name: 'episodeNumber',
      type: 'number',
      required: true,
      min: 1,
      admin: {
        description: 'Episode number in the series',
      },
    },
    {
      name: 'title',
      type: 'text',
      required: true,
      admin: {
        placeholder: 'Episode title',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      admin: {
        placeholder: 'Brief description of the episode',
      },
    },
    {
      name: 'synopsis',
      type: 'group',
      fields: [
        {
          name: 'logline',
          type: 'text',
          admin: {
            description: 'One-sentence summary',
          },
        },
        {
          name: 'summary',
          type: 'textarea',
          admin: {
            description: 'Full episode summary',
          },
        },
        {
          name: 'themes',
          type: 'json',
          defaultValue: [],
          admin: {
            description: 'Array of themes explored in this episode',
          },
        },
      ],
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'planning',
      options: [
        { label: 'Planning', value: 'planning' },
        { label: 'Scripting', value: 'scripting' },
        { label: 'Storyboarding', value: 'storyboarding' },
        { label: 'Production', value: 'production' },
        { label: 'Editing', value: 'editing' },
        { label: 'Completed', value: 'completed' },
      ],
    },
    {
      name: 'script',
      type: 'group',
      fields: [
        {
          name: 'content',
          type: 'textarea',
          admin: {
            description: 'Full script content',
          },
        },
        {
          name: 'version',
          type: 'number',
          defaultValue: 1,
          admin: {
            description: 'Script version number',
          },
        },
        {
          name: 'wordCount',
          type: 'number',
          admin: {
            description: 'Total word count',
            readOnly: true,
          },
        },
        {
          name: 'estimatedDuration',
          type: 'number',
          admin: {
            description: 'Estimated duration in seconds',
            readOnly: true,
          },
        },
      ],
    },
    {
      name: 'production',
      type: 'group',
      admin: {
        description: 'Production progress tracking',
      },
      fields: [
        {
          name: 'sceneCount',
          type: 'number',
          defaultValue: 0,
          admin: {
            readOnly: true,
          },
        },
        {
          name: 'completedScenes',
          type: 'number',
          defaultValue: 0,
          admin: {
            readOnly: true,
          },
        },
        {
          name: 'renderProgress',
          type: 'number',
          min: 0,
          max: 100,
          defaultValue: 0,
          admin: {
            description: 'Overall render progress percentage',
            readOnly: true,
          },
        },
      ],
    },
    {
      name: 'metadata',
      type: 'group',
      fields: [
        {
          name: 'duration',
          type: 'number',
          admin: {
            description: 'Actual duration in seconds (after rendering)',
          },
        },
        {
          name: 'finalVideo',
          type: 'relationship',
          relationTo: 'media',
          filterOptions: {
            mediaType: { equals: 'final_video' },
          },
          admin: {
            description: 'Final rendered episode video',
          },
        },
        {
          name: 'thumbnail',
          type: 'relationship',
          relationTo: 'media',
          admin: {
            description: 'Episode thumbnail image',
          },
        },
      ],
    },
  ],
  hooks: {
    beforeChange: [
      ({ data, operation }) => {
        // Auto-calculate word count and estimated duration
        if (data.script?.content) {
          const wordCount = data.script.content.trim().split(/\s+/).length
          data.script.wordCount = wordCount
          // Estimate 150 words per minute for dialogue
          data.script.estimatedDuration = Math.ceil((wordCount / 150) * 60)
        }
        return data
      },
    ],
  },
  timestamps: true,
}