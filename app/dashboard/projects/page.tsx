import { getPayload } from 'payload'
import config from '@/payload.config'
import Link from 'next/link'

interface Project {
  id: string
  title: string
  description: string
  genre: string
  status: string
  progress: {
    overallProgress: number
    currentPhase: string
  }
  createdAt: string
  updatedAt: string
}

export default async function ProjectsPage() {
  let projects: Project[] = []
  
  try {
    const payload = await getPayload({ config })
    const result = await payload.find({
      collection: 'projects',
      limit: 50,
      sort: '-updatedAt',
    })
    projects = result.docs as Project[]
  } catch (error) {
    console.error('Error fetching projects:', error)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Projects</h1>
          <p className="text-slate-400 mt-1">Manage your movie projects</p>
        </div>
        <button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors">
          New Project
        </button>
      </div>

      {/* Projects Grid */}
      {projects.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div key={project.id} className="bg-slate-800 rounded-lg p-6 hover:bg-slate-700 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-white text-lg mb-2">{project.title}</h3>
                  <p className="text-slate-400 text-sm line-clamp-2 mb-3">
                    {project.description || 'No description provided'}
                  </p>
                </div>
              </div>

              {/* Genre & Status */}
              <div className="flex items-center gap-2 mb-4">
                <span className="bg-purple-600/20 text-purple-400 px-2 py-1 rounded text-xs">
                  {project.genre}
                </span>
                <span className="bg-slate-600/50 text-slate-300 px-2 py-1 rounded text-xs">
                  {project.status}
                </span>
              </div>

              {/* Progress */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-400 text-sm">Progress</span>
                  <span className="text-slate-300 text-sm">
                    {project.progress?.overallProgress || 0}%
                  </span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div 
                    className="bg-purple-600 h-2 rounded-full"
                    style={{ width: `${project.progress?.overallProgress || 0}%` }}
                  ></div>
                </div>
                {project.progress?.currentPhase && (
                  <p className="text-slate-400 text-xs mt-1">
                    Current: {project.progress.currentPhase}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Link 
                  href={`/dashboard/projects/${project.id}`}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded text-sm text-center transition-colors"
                >
                  View Details
                </Link>
                <Link 
                  href={`/dashboard/projects/${project.id}/chat`}
                  className="flex-1 border border-slate-600 text-slate-300 hover:bg-slate-600 px-4 py-2 rounded text-sm text-center transition-colors"
                >
                  Chat
                </Link>
              </div>

              {/* Timestamps */}
              <div className="mt-4 pt-4 border-t border-slate-700">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Created: {new Date(project.createdAt).toLocaleDateString()}</span>
                  <span>Updated: {new Date(project.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="text-6xl mb-6">🎬</div>
          <h2 className="text-2xl font-bold text-white mb-4">No Projects Yet</h2>
          <p className="text-slate-400 mb-8 max-w-md mx-auto">
            Start your creative journey by creating your first movie project. 
            Our AI will guide you through the entire production process.
          </p>
          <div className="space-y-4">
            <button className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors">
              Create Your First Project
            </button>
            <div className="text-slate-400 text-sm">
              <p>Or explore sample projects to get started</p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      {projects.length > 0 && (
        <div className="bg-slate-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Project Overview</h2>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">{projects.length}</div>
              <div className="text-slate-400 text-sm">Total Projects</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">
                {projects.filter(p => p.status === 'active').length}
              </div>
              <div className="text-slate-400 text-sm">Active</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">
                {projects.filter(p => p.status === 'completed').length}
              </div>
              <div className="text-slate-400 text-sm">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">
                {Math.round(projects.reduce((acc, p) => acc + (p.progress?.overallProgress || 0), 0) / projects.length) || 0}%
              </div>
              <div className="text-slate-400 text-sm">Avg Progress</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}