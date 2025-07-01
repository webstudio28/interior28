import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

const CreateFlat = () => {
  const [formData, setFormData] = useState({
    building_name: '',
    flat_number: '',
    sq_meters: '',
    number_of_rooms: 1
  })
  const [rooms, setRooms] = useState([{ room_name: '', sq_meters: '' }])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const { user } = useAuth()
  const navigate = useNavigate()

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleRoomChange = (index, field, value) => {
    setRooms(prev => prev.map((room, i) => 
      i === index ? { ...room, [field]: value } : room
    ))
  }

  const addRoom = () => {
    if (rooms.length < 10) {
      setRooms(prev => [...prev, { room_name: '', sq_meters: '' }])
      setFormData(prev => ({ ...prev, number_of_rooms: prev.number_of_rooms + 1 }))
    }
  }

  const removeRoom = (index) => {
    if (rooms.length > 1) {
      setRooms(prev => prev.filter((_, i) => i !== index))
      setFormData(prev => ({ ...prev, number_of_rooms: prev.number_of_rooms - 1 }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Validate rooms
      const validRooms = rooms.filter(room => room.room_name.trim() && room.sq_meters)
      if (validRooms.length === 0) {
        throw new Error('At least one room is required')
      }

      // Create flat
      const { data: flatData, error: flatError } = await supabase
        .from('flats')
        .insert([{
          user_id: user.id,
          building_name: formData.building_name,
          flat_number: formData.flat_number,
          sq_meters: parseFloat(formData.sq_meters),
          number_of_rooms: validRooms.length
        }])
        .select()
        .single()

      if (flatError) throw flatError

      // Create rooms
      const roomsData = validRooms.map(room => ({
        flat_id: flatData.id,
        room_name: room.room_name,
        sq_meters: parseFloat(room.sq_meters)
      }))

      const { error: roomsError } = await supabase
        .from('rooms')
        .insert(roomsData)

      if (roomsError) throw roomsError

      navigate('/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-main py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Create New Flat Visualization
          </h1>
          <p className="text-xl text-white/80">
            Set up your flat details and add rooms to get started
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Flat Details */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  Building Name
                </label>
                <input
                  type="text"
                  name="building_name"
                  value={formData.building_name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  placeholder="Enter building name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  Flat Number
                </label>
                <input
                  type="text"
                  name="flat_number"
                  value={formData.flat_number}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  placeholder="Enter flat number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  Total Square Meters
                </label>
                <input
                  type="number"
                  name="sq_meters"
                  value={formData.sq_meters}
                  onChange={handleInputChange}
                  required
                  min="1"
                  step="0.1"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  placeholder="Enter total area"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  Number of Rooms
                </label>
                <input
                  type="number"
                  value={formData.number_of_rooms}
                  readOnly
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white/70 cursor-not-allowed"
                />
              </div>
            </div>

            {/* Rooms Section */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white">
                  Room Details
                </h3>
                <button
                  type="button"
                  onClick={addRoom}
                  disabled={rooms.length >= 10}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white font-medium px-4 py-2 rounded-lg transition-colors duration-200"
                >
                  Add Room
                </button>
              </div>

              <div className="space-y-4">
                {rooms.map((room, index) => (
                  <div key={index} className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-medium text-white">
                        Room {index + 1}
                      </h4>
                      {rooms.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeRoom(index)}
                          className="text-red-400 hover:text-red-300 transition-colors duration-200"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-white/90 mb-2">
                          Room Name
                        </label>
                        <input
                          type="text"
                          value={room.room_name}
                          onChange={(e) => handleRoomChange(index, 'room_name', e.target.value)}
                          required
                          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                          placeholder="e.g., Living Room, Bedroom"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-white/90 mb-2">
                          Square Meters
                        </label>
                        <input
                          type="number"
                          value={room.sq_meters}
                          onChange={(e) => handleRoomChange(index, 'sq_meters', e.target.value)}
                          required
                          min="1"
                          step="0.1"
                          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                          placeholder="Enter room area"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="px-6 py-3 border border-white/20 text-white font-medium rounded-lg hover:bg-white/10 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white font-semibold px-8 py-3 rounded-lg transition-colors duration-200"
              >
                {loading ? 'Creating...' : 'Create Flat'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default CreateFlat