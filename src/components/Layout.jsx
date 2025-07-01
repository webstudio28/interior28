import { useAuth } from '../contexts/AuthContext'
import { useNavigate, Link } from 'react-router-dom'

const Layout = ({ children }) => {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-gradient-main">
      {user && (
        <nav className="bg-black/20 backdrop-blur-sm border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <Link to="/dashboard" className="text-xl font-bold text-white hover:text-blue-300 transition-colors duration-200">
                  FlatsVision
                </Link>
              </div>
              <div className="flex items-center space-x-4">
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
            </div>
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