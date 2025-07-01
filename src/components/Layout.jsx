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
                <Link to="/dashboard" className="text-3xl md:text-4xl font-black tracking-wider text-[#f5f0e6] drop-shadow-[0_4px_18px_rgba(30,30,30,0.7)] hover:text-[#f5f0e6] transition-colors duration-200">
                  interior28
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