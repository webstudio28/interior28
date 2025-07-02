import { useAuth } from '../contexts/AuthContext'
import { useNavigate, Link } from 'react-router-dom'
import { useState } from 'react'

const Layout = ({ children }) => {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
    setIsMenuOpen(false)
  }

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  return (
    <div className="min-h-screen bg-gradient-main">
      {user && (
        <nav className="bg-black/20 backdrop-blur-sm border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <Link to="/dashboard" className="text-3xl md:text-4xl font-black tracking-wider text-[#f5f0e6] drop-shadow-[0_4px_18px_rgba(30,30,30,0.7)] hover:text-[#f5f0e6] transition-colors duration-200">
                  interior28
                </Link>
              </div>
              
              {/* Desktop Menu */}
              <div className="hidden md:flex items-center space-x-4">
                <span className="text-white/80 text-sm">
                  {user.email}
                </span>
                <button
                  onClick={handleSignOut}
                  className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                >
                  Sign Out
                </button>
              </div>

              {/* Mobile Hamburger Menu Button */}
              <div className="md:hidden">
                <button
                  onClick={toggleMenu}
                  className="text-white p-2 rounded-lg hover:bg-white/10 transition-colors duration-200"
                  aria-label="Toggle menu"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    {isMenuOpen ? (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    ) : (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 6h16M4 12h16M4 18h16"
                      />
                    )}
                  </svg>
                </button>
              </div>
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
              <div className="md:hidden border-t border-white/10">
                <div className="px-2 pt-2 pb-3 space-y-2">
                  <div className="px-3 py-2 text-white/80 text-sm">
                    {user.email}
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="w-full text-left px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors duration-200"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </nav>
      )}
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}

export default Layout