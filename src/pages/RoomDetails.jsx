import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const INTERIOR_STYLES = [
  'Scandinavian',
  'Modern',
  'Bohemian',
  'Rustic',
  'Industrial',
  'Minimalist',
  'Traditional',
  'Contemporary',
  'Art Deco',
  'Mediterranean'
]

const RoomDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [room, setRoom] = useState(null)
  const [flat, setFlat] = useState(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [transforming, setTransforming] = useState(false)
  const [selectedStyle, setSelectedStyle] = useState('')
  const [transformError, setTransformError] = useState(null)
  const [testingAPI, setTestingAPI] = useState(false)
  const [apiTestResult, setApiTestResult] = useState(null)

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
      setSelectedStyle(roomData.interior_style || '')
    } catch (error) {
      console.error('Error fetching room details:', error)
      navigate('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const testStabilityAPI = async () => {
    setTestingAPI(true)
    setApiTestResult(null)

    try {
      console.log('Testing Stability API...')
      
      const { data, error } = await supabase.functions.invoke('test-stability', {
        body: { test: true }
      })

      console.log('Test function response:', { data, error })

      if (error) {
        console.error('Test function error:', error)
        setApiTestResult({
          success: false,
          error: 'Failed to call test function',
          type: 'function_error',
          details: error.message
        })
        return
      }

      setApiTestResult(data)
    } catch (error) {
      console.error('Test error:', error)
      setApiTestResult({
        success: false,
        error: 'Unexpected error during API test',
        type: 'unexpected',
        details: error.message
      })
    } finally {
      setTestingAPI(false)
    }
  }

  const handleImageUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    setUploading(true)
    
    try {
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `original_${room.id}_${Date.now()}.${fileExt}`
      const filePath = `original/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('room-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('room-images')
        .getPublicUrl(filePath)

      // Update room with image URL
      const { error: updateError } = await supabase
        .from('rooms')
        .update({ original_image_url: publicUrl })
        .eq('id', id)

      if (updateError) throw updateError

      setRoom(prev => ({ ...prev, original_image_url: publicUrl }))
    } catch (error) {
      console.error('Error uploading image:', error)
      alert('Error uploading image. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const handleStyleTransform = async () => {
    if (!selectedStyle || !room.original_image_url) return

    setTransforming(true)
    setTransformError(null)

    try {
      console.log('Starting transformation...')
      console.log('Room ID:', room.id)
      console.log('Image URL:', room.original_image_url)
      console.log('Style:', selectedStyle)

      // Call the new Vercel API endpoint
      const response = await fetch('https://vision-f.vercel.app/api/transform-room', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageUrl: room.original_image_url,
          interiorStyle: selectedStyle,
          roomId: room.id
        })
      })
      const data = await response.json()
      const error = !response.ok ? { message: data.error || 'API error' } : null

      console.log('Function response:', { data, error })

      if (error) {
        console.error('Supabase function error:', error)
        
        // Handle different types of errors
        if (error.message && error.message.includes('FunctionsHttpError')) {
          setTransformError({
            type: 'configuration',
            message: 'The AI transformation service returned an error.',
            details: `HTTP Error: ${error.message}. This usually means the function is not properly configured or there's an issue with the API key setup.`
          })
        } else if (error.message && error.message.includes('FunctionsFetchError')) {
          setTransformError({
            type: 'network',
            message: 'Failed to connect to the transformation service.',
            details: `Network Error: ${error.message}. The function may not be deployed or there's a connectivity issue.`
          })
        } else {
          setTransformError({
            type: 'unknown',
            message: 'An error occurred calling the transformation service.',
            details: error.message || 'Unknown error'
          })
        }
        return
      }

      if (!data) {
        setTransformError({
          type: 'response',
          message: 'No response received from the transformation service.',
          details: 'The service may be temporarily unavailable.'
        })
        return
      }

      console.log('Function returned data:', data)

      if (!data.success) {
        console.error('Transform function returned error:', data)
        
        // Handle specific error types from the edge function
        if (data.error && data.error.includes('not configured as a Supabase secret')) {
          setTransformError({
            type: 'configuration',
            message: 'Stability AI API key is not configured as a Supabase secret.',
            details: data.hint || 'You must use the Supabase CLI to set secrets, not the dashboard environment variables.',
            setupInstructions: data.setupInstructions
          })
        } else if (data.error && data.error.includes('Insufficient credits')) {
          setTransformError({
            type: 'credits',
            message: 'Insufficient credits in your Stability AI account.',
            details: data.hint || 'Please add credits to your Stability AI account to continue.'
          })
        } else if (data.error && data.error.includes('Rate limit')) {
          setTransformError({
            type: 'rate_limit',
            message: 'Rate limit exceeded.',
            details: 'Please wait a few moments before trying again.'
          })
        } else {
          setTransformError({
            type: 'service',
            message: 'Transformation failed.',
            details: data.error || 'An unknown error occurred during transformation.'
          })
        }
        return
      }

      // Success - refresh room data to get the updated transformed image
      console.log('Transformation successful, refreshing room data...')
      await fetchRoomDetails()
      setTransformError(null)

    } catch (error) {
      console.error('Error transforming room:', error)
      setTransformError({
        type: 'unexpected',
        message: 'An unexpected error occurred.',
        details: error.message
      })
    } finally {
      setTransforming(false)
    }
  }

  const handleDownload = async () => {
    if (!room.transformed_image_url) return

    try {
      const response = await fetch(room.transformed_image_url)
      const blob = await response.blob()
      
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${room.room_name}-${room.interior_style}-transformed.jpg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading image:', error)
      alert('Error downloading image. Please try again.')
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
          <Link to="/dashboard" className="text-[#e5e7eb] hover:text-[#f3f4f6] font-medium mb-4 inline-flex items-center transition-colors duration-200">
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-main py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            to={`/flat/${flat.id}`}
            className="text-blue-300 hover:text-blue-200 font-medium mb-4 inline-flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to {flat.building_name}
          </Link>
        </div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            {room.room_name}
          </h1>
          <p className="text-white/80 text-lg mb-2">
            {room.sq_meters} m² • {flat.building_name} #{flat.flat_number}
            <span className="mx-2">·</span>
            <a
              href={`/room/${room.id}/settings`}
              className="inline-flex items-center align-middle text-sm font-medium"
              style={{ color: '#d1d5db' }}
              aria-label="Room Settings"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#d1d5db" className="w-4 h-4 mr-1">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.527-.94 3.31.843 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.527-.843 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.527.94-3.31-.843-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.527.843-3.31 2.37-2.37.996.614 2.296.07 2.573-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Settings
            </a>
          </p>
        </div>

        {/* Debug Information
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-600/30 mb-8">
          <h3 className="text-lg font-bold text-gray-300 mb-4">
            🔍 Debug Information
          </h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-400">Supabase URL:</p>
              <p className="text-gray-200 font-mono text-xs break-all">
                {import.meta.env.VITE_SUPABASE_URL}
              </p>
            </div>
            <div>
              <p className="text-gray-400">Function Endpoint:</p>
              <p className="text-gray-200 font-mono text-xs break-all">
                {import.meta.env.VITE_SUPABASE_URL}/functions/v1/transform-room
              </p>
            </div>
            <div>
              <p className="text-gray-400">Room ID:</p>
              <p className="text-gray-200 font-mono text-xs">
                {room.id}
              </p>
            </div>
            <div>
              <p className="text-gray-400">Has Original Image:</p>
              <p className="text-gray-200">
                {room.original_image_url ? '✅ Yes' : '❌ No'}
              </p>
            </div>
          </div>
        </div> */}

        {/* API Test Section
        <div className="bg-blue-600/20 backdrop-blur-sm rounded-2xl p-6 border border-blue-400/30 mb-8">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-bold text-blue-300 mb-2">
                🔧 Test Stability AI Configuration
              </h3>
              <p className="text-blue-200/80 mb-4">
                Test your Stability AI setup to verify API key, credits, and configuration without using credits for generation.
              </p>
            </div>
            <button
              onClick={testStabilityAPI}
              disabled={testingAPI}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white font-medium px-4 py-2 rounded-lg transition-colors duration-200"
            >
              {testingAPI ? 'Testing...' : 'Test API'}
            </button>
          </div>

          {apiTestResult && (
            <div className="mt-4 p-4 bg-black/20 rounded-lg border border-white/10">
              <h4 className="font-medium text-white mb-2">Test Results:</h4>
              {apiTestResult.success ? (
                <div className="text-green-300">
                  <p className="font-medium">✅ Configuration is working!</p>
                  <p className="text-sm text-green-200/80 mt-1">
                    {apiTestResult.message}
                  </p>
                  {apiTestResult.accountInfo && (
                    <div className="mt-2 space-y-1">
                      <p className="text-sm text-green-200/80">
                        Credits available: {apiTestResult.accountInfo.credits}
                      </p>
                      <p className="text-sm text-green-200/80">
                        Engines: {apiTestResult.accountInfo.engines}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-red-300">
                  <p className="font-medium">❌ Issue found: {apiTestResult.error}</p>
                  <p className="text-sm text-red-200/80 mt-1">
                    Type: {apiTestResult.type}
                  </p>
                  {apiTestResult.hint && (
                    <p className="text-sm text-red-200/80 mt-1">
                      💡 {apiTestResult.hint}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div> */}

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Image Upload Section */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <h2 className="text-xl font-bold text-white mb-6">Room Images</h2>
            
            {!room.original_image_url ? (
              <div className="border-2 border-dashed border-white/30 rounded-lg p-8 text-center">
                <svg className="w-12 h-12 text-white/40 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <h3 className="text-lg font-medium text-white mb-2">Upload Room Photo</h3>
                <p className="text-white/70 mb-4">
                  Upload a photo of your room to get started with AI transformation
                </p>
                <div className="bg-blue-600/20 border border-blue-400/30 rounded-lg p-4 mb-4">
                  <p className="text-blue-200 text-sm">
                    💡 <strong>Pro tip:</strong> For best results, use wide images that capture the whole room
                  </p>
                </div>
                <label className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg cursor-pointer transition-colors duration-200 inline-block">
                  {uploading ? 'Uploading...' : 'Choose Photo'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                </label>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Original Image */}
                <div>
                  <h3 className="text-lg font-medium text-white mb-3">Original Photo</h3>
                  <div className="relative">
                    <img
                      src={room.original_image_url}
                      alt={room.room_name}
                      className="w-full h-64 object-cover rounded-lg"
                    />
                    <div className="absolute top-2 right-2">
                      <label className="bg-[#d97706] hover:bg-[#b45309] text-white px-3 py-1 rounded-lg text-sm cursor-pointer transition-colors duration-200 font-medium">
                        Change
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          disabled={uploading}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>
                
                {/* Transformed Image */}
                {room.transformed_image_url && (
                  <div>
                    <h3 className="text-lg font-medium text-white mb-3">
                      AI Transformed - {room.interior_style} Style
                    </h3>
                    <div className="relative">
                      <img
                        src={room.transformed_image_url}
                        alt={`${room.room_name} - ${room.interior_style}`}
                        className="w-full object-contain rounded-lg border-2 border-blue-400/50"
                      />
                      <div className="absolute top-2 right-2">
                        <button
                          onClick={handleDownload}
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg text-sm cursor-pointer transition-colors duration-200 font-medium"
                        >
                          Download
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Style Selection Section */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <h2 className="text-xl font-bold text-white mb-6">Interior Design Style</h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {INTERIOR_STYLES.map((style) => (
                  <button
                    key={style}
                    onClick={() => setSelectedStyle(style)}
                    className={`relative flex flex-col items-center justify-end aspect-square w-full rounded-lg border transition-all duration-200 text-sm font-medium overflow-hidden p-0 ${
                      selectedStyle === style
                        ? 'bg-blue-600 border-blue-500 text-white'
                        : 'bg-white/5 border-white/20 text-white/80 hover:bg-white/10'
                    }`}
                  >
                    <img
                      src={`/assets/images/int-${style.toLowerCase().replace(/ /g, '-')}.jpg`}
                      alt={style + ' style icon'}
                      className="absolute inset-0 w-full h-full object-cover z-0"
                    />
                    <span className="relative z-10 w-full text-center py-2 bg-black/50 text-white text-xs font-semibold mt-auto">
                      {style}
                    </span>
                  </button>
                ))}
              </div>
              
              {selectedStyle && (
                <div className="mt-6 p-4 bg-white/5 rounded-lg border border-white/10">
                  <p className="text-white/80 text-sm mb-4">
                    Selected: <span className="font-medium text-white">{selectedStyle}</span>
                  </p>
                  
                  <button
                    onClick={handleStyleTransform}
                    disabled={!room.original_image_url || transforming}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200"
                  >
                    {transforming ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        AI is transforming your room...
                      </div>
                    ) : (
                      'Transform with Stability AI'
                    )}
                  </button>
                  
                  {!room.original_image_url && (
                    <p className="text-white/60 text-sm mt-2 text-center">
                      Upload a room photo first to enable transformation
                    </p>
                  )}
                </div>
              )}

              {/* Error Display */}
              {transformError && (
                <div className="mt-4 p-4 bg-red-600/20 border border-red-400/30 rounded-lg">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="flex-1">
                      <h4 className="text-red-300 font-medium mb-1">
                        {transformError.message}
                      </h4>
                      <p className="text-red-200/80 text-sm">
                        {transformError.details}
                      </p>
                      
                      {transformError.type === 'configuration' && (
                        <div className="mt-3 p-3 bg-red-600/10 rounded border border-red-400/20">
                          <p className="text-red-200 text-sm font-medium mb-2">Setup Required:</p>
                          <ol className="text-red-200/90 text-sm space-y-1 list-decimal list-inside">
                            <li>Install Supabase CLI: <code className="bg-black/30 px-1 rounded">npm install -g supabase</code></li>
                            <li>Login: <code className="bg-black/30 px-1 rounded">supabase login</code></li>
                            <li>Link project: <code className="bg-black/30 px-1 rounded">supabase link --project-ref YOUR_REF</code></li>
                            <li>Set secret: <code className="bg-black/30 px-1 rounded">supabase secrets set STABILITY_API_KEY="sk-your-key"</code></li>
                            <li>Deploy: <code className="bg-black/30 px-1 rounded">supabase functions deploy transform-room</code></li>
                          </ol>
                        </div>
                      )}
                      
                      {transformError.type === 'credits' && (
                        <div className="mt-3">
                          <a 
                            href="https://platform.stability.ai/" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-red-300 hover:text-red-200 underline text-sm"
                          >
                            Add credits to your Stability AI account →
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* AI Transformation Info
        <div className="mt-8 bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
          <h3 className="text-lg font-bold text-white mb-4">Powered by Stability AI</h3>
          <div className="grid md:grid-cols-3 gap-6 text-white/80">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-blue-300 font-bold">1</span>
              </div>
              <p className="text-sm">Upload your room photo</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-blue-300 font-bold">2</span>
              </div>
              <p className="text-sm">Choose your preferred interior style</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-blue-300 font-bold">3</span>
              </div>
              <p className="text-sm">AI transforms your room while preserving the exact layout</p>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-blue-600/10 rounded-lg border border-blue-400/20">
            <p className="text-blue-200 text-sm">
              <strong>Stability AI Integration:</strong> Using SDXL (Stable Diffusion XL) for high-quality room transformations. 
              The AI maintains your room's exact dimensions and layout while applying professional interior design styles.
            </p>
          </div>
        </div> */}
      </div>
    </div>
  )
}

export default RoomDetails