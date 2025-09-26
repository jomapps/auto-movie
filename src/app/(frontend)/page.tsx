import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            AI Movie Platform
          </h1>
          <p className="text-xl text-slate-300 mb-8 leading-relaxed">
            Create professional movies with AI-powered guidance. From story development 
            to character creation, visual design, and production - all in one collaborative platform.
          </p>
          
          <div className="flex gap-4 justify-center">
            <Link 
              href="/dashboard"
              className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              Get Started
            </Link>
            <Link 
              href="/dashboard/projects"
              className="border border-slate-400 text-slate-200 hover:bg-slate-800 px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              View Projects
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-24 grid md:grid-cols-3 gap-8">
          <div className="bg-slate-800/50 p-6 rounded-lg backdrop-blur-sm">
            <div className="text-3xl mb-4">🎬</div>
            <h3 className="text-xl font-semibold text-white mb-3">Story Development</h3>
            <p className="text-slate-400">
              Guided workflow to develop compelling narratives and episode structures with AI assistance.
            </p>
          </div>
          
          <div className="bg-slate-800/50 p-6 rounded-lg backdrop-blur-sm">
            <div className="text-3xl mb-4">👥</div>
            <h3 className="text-xl font-semibold text-white mb-3">Character Creation</h3>
            <p className="text-slate-400">
              Design memorable characters with AI-generated visuals and detailed personality profiles.
            </p>
          </div>
          
          <div className="bg-slate-800/50 p-6 rounded-lg backdrop-blur-sm">
            <div className="text-3xl mb-4">🎨</div>
            <h3 className="text-xl font-semibold text-white mb-3">Visual Design</h3>
            <p className="text-slate-400">
              Upload references and generate concept art, environments, and visual assets.
            </p>
          </div>
        </div>

        {/* Workflow Steps */}
        <div className="mt-24 text-center">
          <h2 className="text-3xl font-bold text-white mb-12">Simple Workflow</h2>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-3">
              <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto">
                1
              </div>
              <h4 className="font-semibold text-white">Create Project</h4>
              <p className="text-slate-400 text-sm">Start with your movie concept and basic parameters</p>
            </div>
            
            <div className="space-y-3">
              <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto">
                2
              </div>
              <h4 className="font-semibold text-white">Chat & Collaborate</h4>
              <p className="text-slate-400 text-sm">Work with AI to develop story, characters, and visuals</p>
            </div>
            
            <div className="space-y-3">
              <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto">
                3
              </div>
              <h4 className="font-semibant text-white">Upload References</h4>
              <p className="text-slate-400 text-sm">Add visual references and let AI enhance your vision</p>
            </div>
            
            <div className="space-y-3">
              <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto">
                4
              </div>
              <h4 className="font-semibold text-white">Produce</h4>
              <p className="text-slate-400 text-sm">Generate final assets and complete your movie project</p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-24 text-center bg-slate-800/30 rounded-2xl p-12 backdrop-blur-sm">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Create?</h2>
          <p className="text-slate-300 mb-8 max-w-2xl mx-auto">
            Join creators using AI to bring their movie ideas to life. Start your first project in minutes.
          </p>
          <Link 
            href="/dashboard"
            className="bg-purple-600 hover:bg-purple-700 text-white px-12 py-4 rounded-lg font-semibold text-lg transition-colors"
          >
            Start Creating Now
          </Link>
        </div>
      </div>
    </div>
  )
}