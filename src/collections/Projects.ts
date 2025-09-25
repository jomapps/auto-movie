import type { CollectionConfig } from 'payload'

export const Projects: CollectionConfig = {
  slug: 'projects',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'genre', 'status', 'createdBy', 'updatedAt'],
  },
  access: {
    create: ({ req: { user } }) => !!user,
    read: ({ req: { user } }) => {
      if (user?.role === 'admin') return true
      return {
        or: [
          { createdBy: { equals: user?.id } },
          { collaborators: { contains: user?.id } }
        ]
      }
    },
    update: ({ req: { user } }) => {
      if (user?.role === 'admin') return true
      return {
        or: [
          { createdBy: { equals: user?.id } },
          { collaborators: { contains: user?.id } }
        ]
      }
    },
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      admin: {
        placeholder: 'Enter project title',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      admin: {
        placeholder: 'Brief description of your series',
      },
    },
    {
      name: 'genre',
      type: 'select',
      required: true,
      options: [
        { label: 'Action', value: 'action' },
        { label: 'Comedy', value: 'comedy' },
        { label: 'Drama', value: 'drama' },
        { label: 'Horror', value: 'horror' },
        { label: 'Sci-Fi', value: 'sci-fi' },
        { label: 'Thriller', value: 'thriller' },
        { label: 'Romance', value: 'romance' },
        { label: 'Documentary', value: 'documentary' },
      ],
    },
    {
      name: 'episodeCount',
      type: 'number',
      required: true,
      min: 1,
      max: 50,
      defaultValue: 10,
      admin: {
        description: 'Total number of episodes planned',
      },
    },
    {
      name: 'targetAudience',
      type: 'select',
      options: [
        { label: 'Children (G)', value: 'children' },
        { label: 'Family (PG)', value: 'family' },
        { label: 'Teen (PG-13)', value: 'teen' },
        { label: 'Adult (R)', value: 'adult' },
      ],
      defaultValue: 'family',
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'concept',
      options: [
        { label: 'Concept', value: 'concept' },
        { label: 'Pre-Production', value: 'pre-production' },
        { label: 'Production', value: 'production' },
        { label: 'Post-Production', value: 'post-production' },
        { label: 'Completed', value: 'completed' },
        { label: 'On Hold', value: 'on-hold' },
      ],
    },
    {
      name: 'createdBy',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'collaborators',
      type: 'relationship',
      relationTo: 'users',
      hasMany: true,
      admin: {
        description: 'Users who can edit this project',
      },
    },
    {
      name: 'styleReferences',
      type: 'relationship',
      relationTo: 'media',
      hasMany: true,
      filterOptions: {
        mediaType: { equals: 'style_reference' }
      },
      admin: {
        description: 'Reference images for visual style',
      },
    },
    {
      name: 'projectSettings',
      type: 'group',
      fields: [
        {
          name: 'aspectRatio',
          type: 'select',
          defaultValue: '16:9',
          options: [
            { label: '16:9 (Widescreen)', value: '16:9' },
            { label: '4:3 (Standard)', value: '4:3' },
            { label: '21:9 (Cinematic)', value: '21:9' },
          ],
        },
        {
          name: 'episodeDuration',
          type: 'number',
          defaultValue: 22,
          admin: {
            description: 'Target duration per episode in minutes',
          },
        },
        {
          name: 'qualityTier',
          type: 'select',
          defaultValue: 'standard',
          options: [
            { label: 'Draft', value: 'draft' },
            { label: 'Standard', value: 'standard' },
            { label: 'Premium', value: 'premium' },
          ],
        },
      ],
    },
    {
      name: 'progress',
      type: 'group',
      admin: {
        description: 'Automated progress tracking',
      },
      fields: [
        {
          name: 'currentPhase',
          type: 'select',
          defaultValue: 'story_development',
          options: [
            { label: 'Story Development', value: 'story_development' },
            { label: 'Character Creation', value: 'character_creation' },
            { label: 'Visual Design', value: 'visual_design' },
            { label: 'Audio Design', value: 'audio_design' },
            { label: 'Scene Production', value: 'scene_production' },
            { label: 'Post Production', value: 'post_production' },
            { label: 'Final Assembly', value: 'final_assembly' },
          ],
        },
        {
          name: 'completedSteps',
          type: 'json',
          defaultValue: [],
          admin: {
            description: 'Array of completed workflow steps',
          },
        },
        {
          name: 'overallProgress',
          type: 'number',
          min: 0,
          max: 100,
          defaultValue: 0,
          admin: {
            description: 'Overall completion percentage',
          },
        },
      ],
    },
  ],
  hooks: {
    beforeChange: [
      ({ data, operation }) => {
        if (operation === 'create') {
          data.progress = {
            currentPhase: 'story_development',
            completedSteps: [],
            overallProgress: 0,
          }
        }
        return data
      },
    ],
  },
  timestamps: true,
}