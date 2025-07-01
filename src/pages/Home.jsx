import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const Home = () => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-main flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    )
  }

  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="min-h-screen bg-gradient-main flex items-center justify-center px-4">
      <div className="max-w-4xl mx-auto text-center">
        <div className="animate-fade-in">
          <h1 className="text-6xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Transform Your
            <span className="block bg-gradient-to-r from-blue-300 to-violet-300 bg-clip-text text-transparent">
              Living Space
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-white/80 mb-12 max-w-3xl mx-auto leading-relaxed">
            Visualize your flat with AI-powered interior design. Upload photos of your rooms and see them transformed with professional design styles in seconds.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Link
              to="/auth"
              className="bg-white text-blue-900 font-semibold px-8 py-4 rounded-xl hover:bg-blue-50 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              Get Started Free
            </Link>
            <button className="text-white/90 font-medium px-8 py-4 rounded-xl border border-white/20 hover:bg-white/10 transition-all duration-300">
              Learn More
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mt-20 animate-slide-up">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all duration-300">
            <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mb-6 mx-auto">
              <svg className="w-8 h-8 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6a2 2 0 01-2 2H10a2 2 0 01-2-2V5z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-4">Upload & Organize</h3>
            <p className="text-white/70 leading-relaxed">
              Create detailed flat profiles with room-by-room organization. Upload photos of each space to get started.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all duration-300">
            <div className="w-16 h-16 bg-violet-500/20 rounded-full flex items-center justify-center mb-6 mx-auto">
              <svg className="w-8 h-8 text-violet-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-4">Choose Your Style</h3>
            <p className="text-white/70 leading-relaxed">
              Select from 10 professional interior design styles including Scandinavian, Bohemian, Modern, and more.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all duration-300">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-6 mx-auto">
              <svg className="w-8 h-8 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-4">AI Transformation</h3>
            <p className="text-white/70 leading-relaxed">
              Watch as AI transforms your space while maintaining the exact room layout and dimensions.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home