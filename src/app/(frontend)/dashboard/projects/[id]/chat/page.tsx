import { getPayload } from 'payload'
import config from '@/payload.config'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import ChatInterface from '@/components/chat/ChatInterface'

interface ChatPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function ChatPage({ params }: ChatPageProps) {
  const { id } = await params
  let project: any = null
  let activeSessions: any[] = []

  try {
    const payload = await getPayload({ config })

    // Get project details
    project = await payload.findByID({
      collection: 'projects',
      id: id,
    })

    // Get active sessions for this project
    const sessionsResult = await payload.find({
      collection: 'sessions',
      where: {
        and: [
          {
            project: {
              equals: id,
            },
          },
          {
            sessionState: {
              equals: 'active',
            },
          },
        ],
      },
      limit: 1,
      sort: '-updatedAt',
    })
    activeSessions = sessionsResult.docs
  } catch (error) {
    console.error('Error fetching chat data:', error)
    return notFound()
  }

  if (!project) {
    return notFound()
  }

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col">
      {/* Chat Header */}
      <div className="bg-slate-800 px-6 py-4 border-b border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href={`/dashboard/projects/${project.id}`}
              className="text-slate-400 hover:text-white transition-colors"
            >
              ← Back to Project
            </Link>
            <div className="h-6 w-px bg-slate-600" />
            <div>
              <h1 className="text-xl font-semibold text-white">{project.title}</h1>
              <p className="text-slate-400 text-sm">AI-powered movie production chat</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Connection Status */}
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-slate-400 text-sm">Connected</span>
            </div>

            {/* Session Info */}
            {activeSessions.length > 0 && (
              <div className="text-slate-400 text-sm">
                Session: {activeSessions[0].currentStep || 'General'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chat Interface */}
      <div className="flex-1 bg-slate-900">
        <ChatInterface
          projectId={project.id}
          projectTitle={project.title}
          activeSession={activeSessions[0] || null}
        />
      </div>
    </div>
  )
}
