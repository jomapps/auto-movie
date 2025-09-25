import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'name', 'role', 'createdAt'],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'user',
      options: [
        { label: 'User', value: 'user' },
        { label: 'Admin', value: 'admin' },
        { label: 'Producer', value: 'producer' },
      ],
    },
    {
      name: 'preferences',
      type: 'json',
      defaultValue: {},
      admin: {
        description: 'User preferences and settings',
      },
    },
    {
      name: 'subscription',
      type: 'group',
      fields: [
        {
          name: 'tier',
          type: 'select',
          defaultValue: 'free',
          options: [
            { label: 'Free', value: 'free' },
            { label: 'Pro', value: 'pro' },
            { label: 'Enterprise', value: 'enterprise' },
          ],
        },
        {
          name: 'maxProjects',
          type: 'number',
          defaultValue: 1,
        },
        {
          name: 'maxEpisodesPerProject',
          type: 'number',
          defaultValue: 3,
        },
      ],
    },
  ],
  timestamps: true,
}
