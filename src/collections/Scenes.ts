import type { CollectionConfig } from 'payload'

export const Scenes: CollectionConfig = {
  slug: 'scenes',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['sceneNumber', 'title', 'episode', 'production', 'updatedAt'],
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
        description: 'Parent project',
      },
    },
    {
      name: 'episode',
      type: 'relationship',
      relationTo: 'episodes',
      required: true,
      hasMany: false,
      admin: {
        position: 'sidebar',
        description: 'Episode this scene belongs to',
      },
    },
    {
      name: 'sceneNumber',
      type: 'number',
      required: true,
      min: 1,
      admin: {
        description: 'Scene number within the episode',
      },
    },
    {
      name: 'title',
      type: 'text',
      required: true,
      admin: {
        placeholder: 'Scene title or description',
      },
    },
    {
      name: 'script',
      type: 'group',
      fields: [
        {
          name: 'action',
          type: 'textarea',
          admin: {
            description: 'Scene action and direction',
          },
        },
        {
          name: 'dialogue',
          type: 'array',
          fields: [
            {
              name: 'character',
              type: 'relationship',
              relationTo: 'characters',
              required: true,
            },
            {
              name: 'lines',
              type: 'textarea',
              required: true,
              admin: {
                description: 'Character dialogue',
              },
            },
            {
              name: 'emotion',
              type: 'select',
              options: [
                { label: 'Neutral', value: 'neutral' },
                { label: 'Happy', value: 'happy' },
                { label: 'Sad', value: 'sad' },
                { label: 'Angry', value: 'angry' },
                { label: 'Fearful', value: 'fearful' },
                { label: 'Surprised', value: 'surprised' },
                { label: 'Excited', value: 'excited' },
              ],
              defaultValue: 'neutral',
            },
            {
              name: 'timing',
              type: 'number',
              admin: {
                description: 'Timing in seconds for this dialogue',
              },
            },
          ],
        },
        {
          name: 'duration',
          type: 'number',
          admin: {
            description: 'Estimated scene duration in seconds',
          },
        },
      ],
    },
    {
      name: 'storyboard',
      type: 'group',
      fields: [
        {
          name: 'panels',
          type: 'array',
          fields: [
            {
              name: 'panelNumber',
              type: 'number',
              required: true,
            },
            {
              name: 'description',
              type: 'textarea',
              admin: {
                description: 'Visual description of the panel',
              },
            },
            {
              name: 'image',
              type: 'relationship',
              relationTo: 'media',
              filterOptions: {
                mediaType: { equals: 'storyboard' },
              },
            },
            {
              name: 'cameraAngle',
              type: 'select',
              options: [
                { label: 'Wide Shot', value: 'wide' },
                { label: 'Medium Shot', value: 'medium' },
                { label: 'Close Up', value: 'closeup' },
                { label: 'Extreme Close Up', value: 'extreme_closeup' },
                { label: 'Over the Shoulder', value: 'over_shoulder' },
                { label: "Bird's Eye", value: 'birds_eye' },
                { label: 'Low Angle', value: 'low_angle' },
                { label: 'High Angle', value: 'high_angle' },
              ],
            },
            {
              name: 'notes',
              type: 'text',
              admin: {
                description: 'Additional notes for this panel',
              },
            },
          ],
        },
      ],
    },
    {
      name: 'production',
      type: 'group',
      admin: {
        description: 'Production status and assets',
      },
      fields: [
        {
          name: 'status',
          type: 'select',
          required: true,
          defaultValue: 'pending',
          options: [
            { label: 'Pending', value: 'pending' },
            { label: 'Generating', value: 'generating' },
            { label: 'Reviewing', value: 'reviewing' },
            { label: 'Approved', value: 'approved' },
            { label: 'Failed', value: 'failed' },
          ],
        },
        {
          name: 'videoSegment',
          type: 'relationship',
          relationTo: 'media',
          filterOptions: {
            mediaType: { equals: 'video_segment' },
          },
          admin: {
            description: 'Generated video for this scene',
          },
        },
        {
          name: 'audioTrack',
          type: 'relationship',
          relationTo: 'media',
          filterOptions: {
            mediaType: { in: ['audio_clip', 'voice_profile'] },
          },
          admin: {
            description: 'Audio track for this scene',
          },
        },
        {
          name: 'attempts',
          type: 'number',
          defaultValue: 0,
          admin: {
            description: 'Number of generation attempts',
            readOnly: true,
          },
        },
        {
          name: 'lastAttempt',
          type: 'date',
          admin: {
            readOnly: true,
          },
        },
      ],
    },
    {
      name: 'characters',
      type: 'relationship',
      relationTo: 'characters',
      hasMany: true,
      admin: {
        description: 'Characters appearing in this scene',
      },
    },
    {
      name: 'location',
      type: 'text',
      admin: {
        description: 'Scene location or setting',
      },
    },
    {
      name: 'timeOfDay',
      type: 'select',
      options: [
        { label: 'Dawn', value: 'dawn' },
        { label: 'Day', value: 'day' },
        { label: 'Dusk', value: 'dusk' },
        { label: 'Night', value: 'night' },
      ],
    },
    {
      name: 'mood',
      type: 'text',
      admin: {
        description: 'Overall mood or atmosphere of the scene',
      },
    },
  ],
  timestamps: true,
}