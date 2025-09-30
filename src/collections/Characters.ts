import type { CollectionConfig } from 'payload'

export const Characters: CollectionConfig = {
  slug: 'characters',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'project', 'updatedAt'],
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
        description: 'Project this character belongs to',
      },
    },
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: {
        placeholder: 'Character name',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      required: true,
      admin: {
        placeholder: 'Brief character description',
      },
    },
    {
      name: 'profile',
      type: 'group',
      fields: [
        {
          name: 'age',
          type: 'text',
          admin: {
            description: 'Character age or age range',
          },
        },
        {
          name: 'gender',
          type: 'text',
          admin: {
            description: 'Character gender',
          },
        },
        {
          name: 'personality',
          type: 'json',
          defaultValue: [],
          admin: {
            description: 'Array of personality traits',
          },
        },
        {
          name: 'backstory',
          type: 'textarea',
          admin: {
            description: 'Character backstory and history',
          },
        },
        {
          name: 'motivations',
          type: 'json',
          defaultValue: [],
          admin: {
            description: 'Array of character motivations and goals',
          },
        },
        {
          name: 'relationships',
          type: 'array',
          fields: [
            {
              name: 'character',
              type: 'relationship',
              relationTo: 'characters',
              admin: {
                description: 'Related character',
              },
            },
            {
              name: 'relationshipType',
              type: 'select',
              options: [
                { label: 'Family', value: 'family' },
                { label: 'Friend', value: 'friend' },
                { label: 'Enemy', value: 'enemy' },
                { label: 'Romantic', value: 'romantic' },
                { label: 'Rival', value: 'rival' },
                { label: 'Mentor', value: 'mentor' },
                { label: 'Other', value: 'other' },
              ],
            },
            {
              name: 'description',
              type: 'text',
              admin: {
                description: 'Describe the relationship',
              },
            },
          ],
        },
      ],
    },
    {
      name: 'visualDesign',
      type: 'group',
      fields: [
        {
          name: 'referenceImages',
          type: 'relationship',
          relationTo: 'media',
          hasMany: true,
          filterOptions: {
            mediaType: { equals: 'character_design' },
          },
          admin: {
            description: 'Reference images for character design',
          },
        },
        {
          name: 'finalDesign',
          type: 'relationship',
          relationTo: 'media',
          filterOptions: {
            mediaType: { equals: 'character_design' },
          },
          admin: {
            description: 'Final approved character design',
          },
        },
        {
          name: 'styleNotes',
          type: 'textarea',
          admin: {
            description: 'Style guidelines and notes',
          },
        },
        {
          name: 'colorPalette',
          type: 'json',
          defaultValue: [],
          admin: {
            description: 'Array of hex color codes for character palette',
          },
        },
      ],
    },
    {
      name: 'voiceProfile',
      type: 'group',
      fields: [
        {
          name: 'voiceId',
          type: 'text',
          admin: {
            description: 'ElevenLabs or other TTS voice ID',
          },
        },
        {
          name: 'audioSample',
          type: 'relationship',
          relationTo: 'media',
          filterOptions: {
            mediaType: { equals: 'voice_profile' },
          },
          admin: {
            description: 'Sample audio of character voice',
          },
        },
        {
          name: 'voiceCharacteristics',
          type: 'json',
          defaultValue: [],
          admin: {
            description: 'Array of voice characteristics (pitch, tone, accent, etc.)',
          },
        },
      ],
    },
    {
      name: 'appearances',
      type: 'array',
      admin: {
        description: 'Track character appearances across episodes',
        readOnly: true,
      },
      fields: [
        {
          name: 'episode',
          type: 'relationship',
          relationTo: 'episodes',
        },
        {
          name: 'sceneIds',
          type: 'json',
          defaultValue: [],
          admin: {
            description: 'Array of scene IDs where character appears',
          },
        },
        {
          name: 'screenTime',
          type: 'number',
          admin: {
            description: 'Total screen time in seconds',
          },
        },
      ],
    },
  ],
  timestamps: true,
}