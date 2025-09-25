import Link from 'next/link'

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400 mt-1">Welcome back to your AI Movie Platform</p>
        </div>
        <Link 
          href="/dashboard/projects"
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
        >
          New Project
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-4 gap-6">
        <div className="bg-slate-800 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Total Projects</p>
              <p className="text-2xl font-bold text-white">0</p>
            </div>
            <div className="text-purple-400 text-2xl">🎬</div>
          </div>
        </div>
        
        <div className="bg-slate-800 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Active Sessions</p>
              <p className="text-2xl font-bold text-white">0</p>
            </div>
            <div className="text-green-400 text-2xl">💬</div>
          </div>
        </div>
        
        <div className="bg-slate-800 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Media Assets</p>
              <p className="text-2xl font-bold text-white">0</p>
            </div>
            <div className="text-blue-400 text-2xl">🎨</div>
          </div>
        </div>
        
        <div className="bg-slate-800 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Completion Rate</p>
              <p className="text-2xl font-bold text-white">0%</p>
            </div>
            <div className="text-yellow-400 text-2xl">📊</div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent Projects */}
        <div className="bg-slate-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Recent Projects</h2>
            <Link href="/dashboard/projects" className="text-purple-400 hover:text-purple-300 text-sm">
              View All
            </Link>
          </div>
          
          <div className="space-y-3">
            <div className="text-center py-8 text-slate-400">
              <div className="text-4xl mb-4">🎬</div>
              <p>No projects yet</p>
              <Link 
                href="/dashboard/projects"
                className="text-purple-400 hover:text-purple-300 text-sm underline"
              >
                Create your first project
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Sessions */}
        <div className="bg-slate-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Recent Sessions</h2>
            <Link href="/dashboard/sessions" className="text-purple-400 hover:text-purple-300 text-sm">
              View All
            </Link>
          </div>
          
          <div className="space-y-3">
            <div className="text-center py-8 text-slate-400">
              <div className="text-4xl mb-4">💬</div>
              <p>No chat sessions yet</p>
              <p className="text-sm mt-2">Sessions will appear here when you start chatting with AI</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-slate-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
        
        <div className="grid md:grid-cols-3 gap-4">
          <Link 
            href="/dashboard/projects"
            className="flex items-center space-x-3 p-4 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
          >
            <div className="text-2xl">🎬</div>
            <div>
              <h3 className="font-semibold text-white">Start New Project</h3>
              <p className="text-slate-400 text-sm">Begin your movie creation journey</p>
            </div>
          </Link>
          
          <Link 
            href="/dashboard/media"
            className="flex items-center space-x-3 p-4 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
          >
            <div className="text-2xl">📁</div>
            <div>
              <h3 className="font-semibold text-white">Upload References</h3>
              <p className="text-slate-400 text-sm">Add visual references for AI guidance</p>
            </div>
          </Link>
          
          <div className="flex items-center space-x-3 p-4 bg-slate-700/50 rounded-lg opacity-50">
            <div className="text-2xl">🤖</div>
            <div>
              <h3 className="font-semibold text-white">AI Chat Assistant</h3>
              <p className="text-slate-400 text-sm">Available after creating a project</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}