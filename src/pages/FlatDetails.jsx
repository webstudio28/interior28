import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const FlatDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [flat, setFlat] = useState(null)
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddRoom, setShowAddRoom] = useState(false)
  const [newRoom, setNewRoom] = useState({ room_name: '', sq_meters: '' })

  useEffect(() => {
    fetchFlatDetails()
  }, [id])

  const fetchFlatDetails = async () => {
    try {
      // Fetch flat details
      const { data: flatData, error: flatError } = await supabase
        .from('flats')
        .select('*')
        .eq('id', id)
        .single()

      if (flatError) throw flatError

      // Fetch rooms
      const { data: roomsData, error: roomsError } = await supabase
        .from('rooms')
        .select('*')
        .eq('flat_id', id)
        .order('created_at', { ascending: true })

      if (roomsError) throw roomsError

      setFlat(flatData)
      setRooms(roomsData || [])
    } catch (error) {
      console.error('Error fetching flat details:', error)
      navigate('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const handleAddRoom = async (e) => {
    e.preventDefault()
    
    try {
      const { data, error } = await supabase
        .from('rooms')
        .insert([{
          flat_id: id,
          room_name: newRoom.room_name,
          sq_meters: parseFloat(newRoom.sq_meters)
        }])
        .select()
        .single()

      if (error) throw error

      setRooms(prev => [...prev, data])
      setNewRoom({ room_name: '', sq_meters: '' })
      setShowAddRoom(false)

      // Update flat's room count
      await supabase
        .from('flats')
        .update({ number_of_rooms: rooms.length + 1 })
        .eq('id', id)

      setFlat(prev => ({ ...prev, number_of_rooms: prev.number_of_rooms + 1 }))
    } catch (error) {
      console.error('Error adding room:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-main flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    )
  }

  if (!flat) {
    return (
      <div className="min-h-screen bg-gradient-main flex items-center justify-center">
        <div className="text-center text-white">
          <h2 className="text-2xl font-bold mb-4">Flat not found</h2>
          <Link to="/dashboard" className="text-blue-300 hover:text-blue-200">
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-main py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            to="/dashboard"
            className="text-blue-300 hover:text-blue-200 font-medium mb-4 inline-flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </Link>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                {flat.building_name}
              </h1>
              <p className="text-white/80 text-lg mb-4 md:mb-0">
                Flat #{flat.flat_number} • {flat.sq_meters} m² • {flat.number_of_rooms} rooms
              </p>
            </div>
            
            {rooms.length < 10 && (
              <button
                onClick={() => setShowAddRoom(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg transition-colors duration-200"
              >
                Add New Room
              </button>
            )}
          </div>
        </div>

        {/* Add Room Modal */}
        {showAddRoom && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 max-w-md w-full">
              <h3 className="text-xl font-bold text-white mb-6">Add New Room</h3>
              
              <form onSubmit={handleAddRoom} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/90 mb-2">
                    Room Name
                  </label>
                  <input
                    type="text"
                    value={newRoom.room_name}
                    onChange={(e) => setNewRoom(prev => ({ ...prev, room_name: e.target.value }))}
                    required
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                    placeholder="e.g., Master Bedroom"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-white/90 mb-2">
                    Square Meters
                  </label>
                  <input
                    type="number"
                    value={newRoom.sq_meters}
                    onChange={(e) => setNewRoom(prev => ({ ...prev, sq_meters: e.target.value }))}
                    required
                    min="1"
                    step="0.1"
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                    placeholder="Enter room area"
                  />
                </div>
                
                <div className="flex justify-end space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddRoom(false)}
                    className="px-4 py-2 border border-white/20 text-white font-medium rounded-lg hover:bg-white/10 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded-lg transition-colors duration-200"
                  >
                    Add Room
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Rooms Grid */}
        {rooms.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-12 max-w-md mx-auto border border-white/20">
              <svg className="w-16 h-16 text-white/40 mx-auto mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <h3 className="text-xl font-semibold text-white mb-4">No Rooms Yet</h3>
              <p className="text-white/70 mb-6">
                Add rooms to start visualizing your interior designs.
              </p>
              <button
                onClick={() => setShowAddRoom(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg transition-colors duration-200"
              >
                Add Your First Room
              </button>
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms.map((room) => (
              <div key={room.id} className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 group">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">
                      {room.room_name}
                    </h3>
                    <p className="text-white/70">
                      {room.sq_meters} m²
                    </p>
                  </div>
                  
                  {room.transformed_image_url && (
                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  )}
                </div>
                
                {room.original_image_url && (
                  <div className="mb-4">
                    <img
                      src={room.original_image_url}
                      alt={room.room_name}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  </div>
                )}
                
                <div className="space-y-3">
                  <Link
                    to={`/room/${room.id}`}
                    className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 text-center"
                  >
                    Manage Room
                  </Link>
                  
                  {room.interior_style && (
                    <div className="text-center">
                      <span className="text-white/60 text-sm">
                        Style: {room.interior_style}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default FlatDetails