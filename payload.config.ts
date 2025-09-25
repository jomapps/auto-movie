import { buildConfig } from 'payload'
import path from 'path'
import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { Users, Projects, Sessions, Media } from './src/collections'

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(__dirname),
    },
  },
  collections: [
    Users,
    Projects,
    Sessions,
    Media,
  ],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(__dirname, 'payload-types.ts'),
  },
  db: mongooseAdapter({
    url: process.env.DATABASE_URI || '',
  }),
  cors: [
    'http://localhost:3010',
    'http://localhost:3001', // Grafana dashboard
    'http://localhost:8001', // Celery task service
    'http://localhost:8002', // MCP brain service
    'https://auto-movie.ngrok.pro', // Dev domain
    'https://auto-movie.ft.tc', // Production domain
    process.env.PAYLOAD_PUBLIC_SERVER_URL || '',
  ].filter(Boolean),
  csrf: [
    'http://localhost:3010',
    'http://localhost:3001',
    'http://localhost:8001',
    'http://localhost:8002',
    'https://auto-movie.ngrok.pro',
    'https://auto-movie.ft.tc',
    process.env.PAYLOAD_PUBLIC_SERVER_URL || '',
  ].filter(Boolean),
})