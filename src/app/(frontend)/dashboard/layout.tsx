import Link from 'next/link'
import { ReactNode } from 'react'

interface DashboardLayoutProps {
  children: ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-950">
      {/* Top Navigation */}
      <header className="bg-slate-900 border-b border-slate-800">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="text-xl font-bold text-white">
              AI Movie Platform
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <Link 
                href="/dashboard"
                className="text-slate-300 hover:text-white transition-colors"
              >
                Dashboard
              </Link>
              <Link 
                href="/dashboard/projects"
                className="text-slate-300 hover:text-white transition-colors"
              >
                Projects
              </Link>
              <Link 
                href="/dashboard/media"
                className="text-slate-300 hover:text-white transition-colors"
              >
                Media
              </Link>
            </nav>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-semibold">U</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <div className="flex">
        <aside className="w-64 bg-slate-900 min-h-[calc(100vh-4rem)]">
          <div className="p-4">
            <nav className="space-y-2">
              <Link 
                href="/dashboard"
                className="flex items-center space-x-3 px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                <span className="text-lg">📊</span>
                <span>Overview</span>
              </Link>
              
              <Link 
                href="/dashboard/projects"
                className="flex items-center space-x-3 px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                <span className="text-lg">🎬</span>
                <span>Projects</span>
              </Link>
              
              <Link 
                href="/dashboard/media"
                className="flex items-center space-x-3 px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                <span className="text-lg">🎨</span>
                <span>Media Assets</span>
              </Link>
              
              <div className="pt-4 border-t border-slate-800 mt-4">
                <div className="px-3 py-2 text-slate-400 text-sm font-medium">
                  Recent Sessions
                </div>
                <div className="space-y-1">
                  <div className="px-3 py-2 text-slate-400 text-sm">
                    No recent sessions
                  </div>
                </div>
              </div>
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}