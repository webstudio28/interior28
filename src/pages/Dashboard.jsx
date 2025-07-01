import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

const Dashboard = () => {
  const [flats, setFlats] = useState([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    fetchFlats()
  }, [])

  const fetchFlats = async () => {
    try {
      const { data, error } = await supabase
        .from('flats')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setFlats(data || [])
    } catch (error) {
      console.error('Error fetching flats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-main flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-main">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Your Flats Dashboard
          </h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">
            Manage your flat visualizations and transform your living spaces with AI-powered interior design.
          </p>
        </div>

        <div className="flex justify-center mb-12">
          <Link
            to="/create-flat"
            className="btn-primary"
          >
            Create Flat Visualization
          </Link>
        </div>

        {flats.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-12 max-w-md mx-auto border border-white/20">
              <svg className="w-16 h-16 text-white/40 mx-auto mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <h3 className="text-xl font-semibold text-white mb-4">No Flats Yet</h3>
              <p className="text-white/70">
                Start by creating your first flat visualization to see the magic happen.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {flats.map((flat) => (
              <div key={flat.id} className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 group relative">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">
                      {flat.building_name}
                    </h3>
                    <p className="text-white/70">
                      Flat #{flat.flat_number}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-white/60 text-sm">
                      {flat.sq_meters} m²
                    </p>
                    <p className="text-white/60 text-sm">
                      {flat.number_of_rooms} rooms
                    </p>
                  </div>
                </div>
                
                <div className="space-y-3 flex items-center gap-2">
                  <Link
                    to={`/flat/${flat.id}`}
                    className="block w-full bg-[#18181b] text-white font-semibold py-3 px-4 rounded-lg hover:bg-black transition-colors duration-200 text-center"
                  >
                    Manage Flat
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard