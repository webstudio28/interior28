import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const RoomSettings = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [room, setRoom] = useState(null)
  const [flat, setFlat] = useState(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    fetchRoomDetails()
  }, [id])

  const fetchRoomDetails = async () => {
    try {
      // Fetch room details
      const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', id)
        .single()

      if (roomError) throw roomError

      // Fetch flat details
      const { data: flatData, error: flatError } = await supabase
        .from('flats')
        .select('*')
        .eq('id', roomData.flat_id)
        .single()

      if (flatError) throw flatError

      setRoom(roomData)
      setFlat(flatData)
    } catch (error) {
      console.error('Error fetching room details:', error)
      navigate('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteRoom = async () => {
    if (!room) return

    setDeleting(true)
    try {
      // Delete room
      const { error: deleteError } = await supabase
        .from('rooms')
        .delete()
        .eq('id', id)

      if (deleteError) throw deleteError

      // Update flat's room count
      await supabase
        .from('flats')
        .update({ number_of_rooms: flat.number_of_rooms - 1 })
        .eq('id', flat.id)

      // Navigate back to flat details
      navigate(`/flat/${flat.id}`)
    } catch (error) {
      console.error('Error deleting room:', error)
      alert('Error deleting room. Please try again.')
    } finally {
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-main flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    )
  }

  if (!room || !flat) {
    return (
      <div className="min-h-screen bg-gradient-main flex items-center justify-center">
        <div className="text-center text-white">
          <h2 className="text-2xl font-bold mb-4">Room not found</h2>
          <Link to="/dashboard" className="text-blue-300 hover:text-blue-200">
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-main py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          to={`/room/${id}`}
          className="text-[#e5e7eb] hover:text-[#f3f4f6] font-medium mb-4 inline-flex items-center transition-colors duration-200"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back
        </Link>
        
        <h1 className="text-3xl font-bold text-white mb-8">Room Settings</h1>
        
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 mb-8">
          <h2 className="text-xl font-bold text-white mb-4">{room.room_name}</h2>
          <p className="text-white/80 mb-6">
            {room.sq_meters} m² • {flat.building_name} #{flat.flat_number}
          </p>
        </div>

        <div className="bg-red-600/20 backdrop-blur-sm rounded-2xl p-8 border border-red-400/30">
          <h3 className="text-lg font-bold text-red-300 mb-4">Danger Zone</h3>
          <p className="text-red-200/80 mb-6">
            Once you delete a room, there is no going back. Please be certain.
          </p>
          
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="bg-red-600 hover:bg-red-700 text-white font-medium px-6 py-3 rounded-lg transition-colors duration-200"
          >
            Delete Room
          </button>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 max-w-md w-full">
              <h3 className="text-xl font-bold text-white mb-4">Delete Room</h3>
              <p className="text-white/80 mb-6">
                Are you sure you want to delete "{room.room_name}"? This action cannot be undone.
              </p>
              
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteRoom}
                  disabled={deleting}
                  className="bg-red-600 hover:bg-red-700 disabled:bg-red-800 text-white font-medium px-6 py-3 rounded-lg transition-colors duration-200"
                >
                  {deleting ? 'Deleting...' : 'Delete Room'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default RoomSettings 