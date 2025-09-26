import { getPayload } from 'payload'
import config from '@/payload.config'
import Link from 'next/link'
import { notFound } from 'next/navigation'

interface ProjectDetailPageProps {
  params: {
    id: string
  }
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  let project: any = null
  let sessions: any[] = []
  let media: any[] = []

  try {
    const payload = await getPayload({ config })
    
    // Get project details
    const projectResult = await payload.findByID({
      collection: 'projects',
      id: params.id,
      depth: 1,
    })
    project = projectResult
    
    // Get project sessions
    const sessionsResult = await payload.find({
      collection: 'sessions',
      where: {
        project: {
          equals: params.id
        }
      },
      limit: 10,
      sort: '-updatedAt',
    })
    sessions = sessionsResult.docs
    
    // Get project media
    const mediaResult = await payload.find({
      collection: 'media',
      where: {
        project: {
          equals: params.id
        }
      },
      limit: 20,
      sort: '-createdAt',
    })
    media = mediaResult.docs
    
  } catch (error) {
    console.error('Error fetching project details:', error)
    return notFound()
  }

  if (!project) {
    return notFound()
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Link 
              href="/dashboard/projects"
              className="text-slate-400 hover:text-white transition-colors"
            >
              ← Back to Projects
            </Link>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">{project.title}</h1>
          <p className="text-slate-400 text-lg mb-4">
            {project.description || 'No description provided'}
          </p>
          
          <div className="flex items-center gap-4">
            <span className="bg-purple-600/20 text-purple-400 px-3 py-1 rounded-full text-sm">
              {project.genre}
            </span>
            <span className="bg-slate-600/50 text-slate-300 px-3 py-1 rounded-full text-sm">
              {project.status}
            </span>
            <span className="text-slate-400 text-sm">
              {project.episodeCount} episodes planned
            </span>
          </div>
        </div>
        
        <div className="flex gap-3">
          <Link
            href={`/dashboard/projects/${project.id}/chat`}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Open Chat
          </Link>
          <button className="border border-slate-600 text-slate-300 hover:bg-slate-600 px-6 py-3 rounded-lg font-semibold transition-colors">
            Settings
          </button>
        </div>
      </div>

      {/* Progress Overview */}
      <div className="bg-slate-800 rounded-xl p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Project Progress</h2>
        <div className="grid md:grid-cols-2 gap-8">
          {/* Overall Progress */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-slate-300">Overall Progress</span>
              <span className="text-white font-semibold">
                {project.progress?.overallProgress || 0}%
              </span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-3">
              <div 
                className="bg-purple-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${project.progress?.overallProgress || 0}%` }}
              />
            </div>
            {project.progress?.currentPhase && (
              <p className="text-slate-400 text-sm mt-2">
                Current Phase: {project.progress.currentPhase}
              </p>
            )}
          </div>
          
          {/* Project Settings */}
          <div className="space-y-3">
            <h3 className="text-lg font-medium text-white">Project Settings</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-400">Target Audience:</span>
                <div className="text-white">{project.targetAudience || 'General'}</div>
              </div>
              <div>
                <span className="text-slate-400">Quality Tier:</span>
                <div className="text-white">{project.projectSettings?.qualityTier || 'Standard'}</div>
              </div>
              <div>
                <span className="text-slate-400">Aspect Ratio:</span>
                <div className="text-white">{project.projectSettings?.aspectRatio || '16:9'}</div>
              </div>
              <div>
                <span className="text-slate-400">Episode Duration:</span>
                <div className="text-white">{project.projectSettings?.episodeDuration || 30} min</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Recent Sessions */}
        <div className="bg-slate-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Recent Chat Sessions</h2>
            <Link
              href={`/dashboard/projects/${project.id}/chat`}
              className="text-purple-400 hover:text-purple-300 text-sm font-medium"
            >
              View All
            </Link>
          </div>
          
          {sessions.length > 0 ? (
            <div className="space-y-3">
              {sessions.slice(0, 5).map((session: any) => (
                <div key={session.id} className="bg-slate-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-medium">
                      {session.currentStep || 'General Chat'}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      session.sessionState === 'active' 
                        ? 'bg-green-600/20 text-green-400' 
                        : 'bg-slate-600/50 text-slate-400'
                    }`}>
                      {session.sessionState}
                    </span>
                  </div>
                  <p className="text-slate-400 text-sm">
                    Last activity: {new Date(session.updatedAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-3xl mb-3">💬</div>
              <p className="text-slate-400 mb-4">No chat sessions yet</p>
              <Link
                href={`/dashboard/projects/${project.id}/chat`}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
              >
                Start Chatting
              </Link>
            </div>
          )}
        </div>

        {/* Media Assets */}
        <div className="bg-slate-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Media Assets</h2>
            <button className="text-purple-400 hover:text-purple-300 text-sm font-medium">
              View All
            </button>
          </div>
          
          {media.length > 0 ? (
            <div className="grid grid-cols-3 gap-3">
              {media.slice(0, 6).map((item: any) => (
                <div key={item.id} className="bg-slate-700 rounded-lg p-3 text-center">
                  <div className="text-2xl mb-2">
                    {item.mediaType === 'image' ? '🖼️' : 
                     item.mediaType === 'video' ? '🎬' : 
                     item.mediaType === 'audio' ? '🎵' : '📄'}
                  </div>
                  <p className="text-slate-300 text-xs truncate">
                    {item.description || item.mediaType}
                  </p>
                  <p className="text-slate-500 text-xs mt-1">
                    {item.agentGenerated ? 'AI Generated' : 'Uploaded'}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-3xl mb-3">🎨</div>
              <p className="text-slate-400 mb-4">No media assets yet</p>
              <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm transition-colors">
                Upload Assets
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Project Metadata */}
      <div className="bg-slate-800 rounded-xl p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Project Information</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <h3 className="text-sm font-medium text-slate-400 mb-2">Created</h3>
            <p className="text-white">{new Date(project.createdAt).toLocaleDateString()}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-slate-400 mb-2">Last Updated</h3>
            <p className="text-white">{new Date(project.updatedAt).toLocaleDateString()}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-slate-400 mb-2">Created By</h3>
            <p className="text-white">
              {typeof project.createdBy === 'object' ? project.createdBy.name : 'User'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}