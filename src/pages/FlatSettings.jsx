import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

const FlatSettings = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [flat, setFlat] = useState(null)
  const [flatName, setFlatName] = useState('')
  const [saving, setSaving] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchFlat = async () => {
      const { data, error } = await supabase
        .from('flats')
        .select('id, building_name')
        .eq('id', id)
        .single()
      if (data) {
        setFlat(data)
        setFlatName(data.building_name)
      }
    }
    fetchFlat()
  }, [id])

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    const { error } = await supabase
      .from('flats')
      .update({ building_name: flatName })
      .eq('id', id)
    setSaving(false)
    if (error) setError('Failed to update flat name.')
    else setFlat(f => ({ ...f, building_name: flatName }))
  }

  const handleDelete = async () => {
    setError('')
    const { error } = await supabase
      .from('flats')
      .delete()
      .eq('id', id)
    if (error) setError('Failed to delete flat.')
    else navigate('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-main py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          to={`/flat/${id}`}
          className="text-[#e5e7eb] hover:text-[#f3f4f6] font-medium mb-4 inline-flex items-center transition-colors duration-200"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back
        </Link>
        <h1 className="text-3xl font-bold text-white mb-8">Flat Settings</h1>
        {/* Edit Flat Details */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-white mb-4">Edit Flat Name</h2>
          <form onSubmit={handleSave} className="flex items-center gap-4 bg-white/10 rounded-xl p-6 border border-white/20 mb-4">
            <input
              type="text"
              value={flatName}
              onChange={e => setFlatName(e.target.value)}
              className="flex-1 px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              placeholder="Flat Name"
              required
            />
            <button type="submit" className="btn-primary min-w-[100px]" disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </button>
          </form>
          {error && <p className="text-red-400 mb-2">{error}</p>}
        </section>
        {/* Delete Flat */}
        <section>
          <h2 className="text-xl font-semibold text-red-400 mb-4">Danger Zone</h2>
          <div className="bg-red-600/10 rounded-xl p-6 border border-red-400/20 mb-4">
            <button
              className="bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors duration-200"
              onClick={() => setShowDeleteConfirm(true)}
            >
              Delete Flat
            </button>
            {showDeleteConfirm && (
              <div className="mt-4 p-4 bg-red-900/80 rounded-lg">
                <p className="text-red-200 mb-4">Are you sure you want to delete this flat? This action cannot be undone.</p>
                <div className="flex gap-4">
                  <button
                    className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-lg"
                    onClick={handleDelete}
                  >
                    Yes, Delete
                  </button>
                  <button
                    className="btn-secondary"
                    onClick={() => setShowDeleteConfirm(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
            {error && <p className="text-red-400 mt-2">{error}</p>}
          </div>
        </section>
      </div>
    </div>
  )
}

export default FlatSettings 