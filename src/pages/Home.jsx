import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
// import heroAnimation from '/public/assets/animations/hero.json'
// Note: .lottie files are not supported by lottie-react directly. You would need a compatible player such as lottie-web or lottie-player web component for .lottie files.
// Example usage if using a compatible player:
// <lottie-player src="/assets/animations/hero.lottie" background="transparent" speed="1" style={{ width: '100%', height: '100%' }} loop autoplay></lottie-player>

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
    <div className="min-h-screen bg-gradient-main flex flex-col items-center justify-start pb-12">
      {/* Header/Nav Bar */}
      <nav className="bg-black/20 backdrop-blur-sm border-b border-white/10 w-full z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to="/" className="text-3xl md:text-4xl font-black tracking-wider text-[#f5f0e6] drop-shadow-[0_4px_18px_rgba(30,30,30,0.7)] hover:text-[#f5f0e6] transition-colors duration-200">
                interior28
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/auth" className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors duration-200">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </nav>
      <div className="w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="w-full flex flex-col lg:flex-row items-center justify-center gap-8 pt-8">
            {/* Hero Text on the left (desktop), below animation on mobile */}
            <div className="flex-1 w-full text-center lg:text-left animate-fade-in order-2 lg:order-1">
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
                Transform Your
                <span className="inline-block w-fit bg-gradient-to-r from-[#ffedd8] via-[#f3d5b5] via-[#e7bc91] via-[#d4a276] to-[#bc8a5f] bg-clip-text text-transparent">
                  Living Space
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-white/80 mb-12 max-w-3xl mx-auto lg:mx-0 leading-relaxed">
                Visualize your flat with AI-powered interior design. Upload photos of your rooms and see them transformed with professional design styles in seconds.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start items-center mb-16">
                <Link
                  to="/auth"
                  className="btn-primary"
                >
                  Get Started Free
                </Link>
                <button className="btn-secondary">
                  Learn More
                </button>
              </div>
            </div>
            {/* Hero Lottie Animation on the right (desktop/tablet), above text on mobile */}
            {/* Make sure to include the following in your index.html head:
                <script src="https://unpkg.com/@lottiefiles/lottie-player@latest/dist/lottie-player.js"></script>
            */}
            <div className="rounded-3xl overflow-hidden flex-1 w-full max-w-lg mx-auto flex items-center justify-center order-1 lg:order-2">
              <lottie-player
                src="/assets/animations/hero.json"
                background="transparent"
                speed="0.5"
                style={{ width: '100%', height: '100%' }}
                loop
                autoplay
              ></lottie-player>
            </div>
          </div>
          <div className="w-full grid md:grid-cols-3 gap-8 mt-20 animate-slide-up">
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
    </div>
  )
}

export default Home