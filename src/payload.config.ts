// storage-adapter-import-placeholder
import { mongooseAdapter } from '@payloadcms/db-mongodb'

import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'
import { s3Storage } from '@payloadcms/storage-s3'
import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Projects } from './collections/Projects'
import { Sessions } from './collections/Sessions'
import { Characters } from './collections/Characters'
import { Episodes } from './collections/Episodes'
import { Scenes } from './collections/Scenes'
import { Tasks } from './collections/Tasks'
import { PromptTemplates } from './collections/PromptTemplates'
import { PromptsExecuted } from './collections/PromptsExecuted'
import { lexicalEditor } from '@payloadcms/richtext-lexical'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const s3Adapter = s3Storage({
  config: {
    endpoint: process.env.R2_ENDPOINT,
    region: 'auto', // Required for Cloudflare R2
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
    forcePathStyle: true, // Required for R2
  },
  bucket: process.env.R2_BUCKET_NAME!,
  collections: {
    media: {
      prefix: 'media', // Optional: organize files in a folder
      generateFileURL: ({ filename }) => {
        // Generate the public URL using the custom domain
        const baseUrl = process.env.R2_PUBLIC_URL || 'https://media.rumbletv.com'
        return `${baseUrl}/media/${filename}`
      },
    },
  },
})

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, Media, Projects, Sessions, Characters, Episodes, Scenes, Tasks, PromptTemplates, PromptsExecuted],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || 'ae6e18cb408bc7128f23585casdlaelwlekoqdsldsa',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: mongooseAdapter({
    url: process.env.DATABASE_URI || '',
  }),
  sharp,
  plugins: [
    s3Adapter,
    // storage-adapter-placeholder
  ],
})
