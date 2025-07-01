const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface TransformRequest {
  imageUrl: string
  interiorStyle: string
  roomId: string
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { imageUrl, interiorStyle, roomId }: TransformRequest = await req.json()

    if (!imageUrl || !interiorStyle || !roomId) {
      throw new Error('Missing required parameters: imageUrl, interiorStyle, and roomId are required')
    }

    // Check for required environment variables
    console.log('Checking environment variables...')
    
    const stabilityApiKey = Deno.env.get('STABILITY_API_KEY')
    const supabaseUrl = Deno.env.get('SB_URL')
    const supabaseServiceKey = Deno.env.get('SB_SERVICE_ROLE_KEY')

    console.log('Environment variables status:')
    console.log('- STABILITY_API_KEY:', stabilityApiKey ? `SET (${stabilityApiKey.substring(0, 8)}...)` : 'NOT SET')
    console.log('- SUPABASE_URL:', supabaseUrl ? 'SET' : 'NOT SET')
    console.log('- SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'SET' : 'NOT SET')

    if (!stabilityApiKey) {
      console.error('STABILITY_API_KEY environment variable is not set')
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Stability AI API key not configured as a Supabase secret.',
          timestamp: new Date().toISOString(),
          hint: 'IMPORTANT: You must set the API key as a Supabase SECRET, not just an environment variable. Use the Supabase CLI: `supabase secrets set STABILITY_API_KEY="your-key-here"` then redeploy with `supabase functions deploy transform-room`',
          setupInstructions: {
            step1: 'Install Supabase CLI if not already installed',
            step2: 'Run: supabase secrets set STABILITY_API_KEY="sk-your-actual-key"',
            step3: 'Run: supabase functions deploy transform-room',
            step4: 'Wait 2-3 minutes for deployment to complete',
            note: 'Dashboard environment variables do NOT work for Edge Functions - you MUST use CLI secrets'
          }
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      )
    }

    if (!supabaseUrl) {
      console.error('SUPABASE_URL environment variable is not set')
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Supabase URL not configured. Please set SUPABASE_URL as a secret.',
          timestamp: new Date().toISOString(),
          hint: 'Run: supabase secrets set SUPABASE_URL="your-supabase-url"'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      )
    }

    if (!supabaseServiceKey) {
      console.error('SUPABASE_SERVICE_ROLE_KEY environment variable is not set')
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Supabase service role key not configured. Please set SUPABASE_SERVICE_ROLE_KEY as a secret.',
          timestamp: new Date().toISOString(),
          hint: 'Run: supabase secrets set SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      )
    }

    console.log('Starting room transformation for room:', roomId)
    console.log('Style:', interiorStyle)
    console.log('Image URL:', imageUrl)

    // First, test the API key with a simple account check
    console.log('Testing Stability AI API key...')
    const accountResponse = await fetch('https://api.stability.ai/v1/user/account', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${stabilityApiKey}`,
        'Accept': 'application/json',
      },
    })

    if (!accountResponse.ok) {
      const errorText = await accountResponse.text()
      console.error('Stability AI account check failed:', accountResponse.status, errorText)
      
      let errorMessage = `Stability AI API key validation failed: ${accountResponse.status}`
      let hint = ''
      
      if (accountResponse.status === 401) {
        errorMessage = 'Invalid Stability AI API key. The key is not valid or has been revoked.'
        hint = 'Please verify your API key in your Stability AI dashboard at https://platform.stability.ai/account/keys'
      } else if (accountResponse.status === 402) {
        errorMessage = 'Insufficient credits in your Stability AI account.'
        hint = 'Please add credits to your Stability AI account at https://platform.stability.ai/account/credits'
      } else if (accountResponse.status === 429) {
        errorMessage = 'Rate limit exceeded. Too many requests to Stability AI.'
        hint = 'Wait a few minutes before trying again'
      } else {
        errorMessage = `Stability AI service error: ${accountResponse.status} - ${errorText}`
        hint = 'Please check the Stability AI service status or try again later'
      }

      return new Response(
        JSON.stringify({
          success: false,
          error: errorMessage,
          timestamp: new Date().toISOString(),
          hint: hint
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      )
    }

    const accountData = await accountResponse.json()
    console.log('Account validation successful. Credits available:', accountData.credits || 'Unknown')

    // Download the original image
    console.log('Downloading original image...')
    const imageResponse = await fetch(imageUrl)
    if (!imageResponse.ok) {
      console.error('Failed to fetch image:', imageResponse.status, imageResponse.statusText)
      throw new Error(`Failed to fetch original image: ${imageResponse.status} ${imageResponse.statusText}`)
    }
    const imageBlob = await imageResponse.blob()
    console.log('Successfully downloaded original image, size:', imageBlob.size, 'bytes')

    // Prepare form data for Stability AI
    const formData = new FormData()
    formData.append('init_image', imageBlob)
    
    // Craft a detailed prompt for interior design transformation
    const prompt = `Transform this room into ${interiorStyle.toLowerCase()} interior design style. 
      Keep the exact same room layout, dimensions, windows, doors, and architectural features. 
      Only change furniture, colors, textures, wall treatments, lighting fixtures, and decorative elements to match ${interiorStyle} style. 
      Maintain the same perspective, room structure, and spatial relationships. 
      High quality, professional interior design, realistic lighting, detailed textures, photorealistic.`
    
    formData.append('text_prompts[0][text]', prompt)
    formData.append('text_prompts[0][weight]', '1')
    
    // Negative prompt to avoid unwanted changes
    const negativePrompt = `changing room layout, moving walls, changing windows, changing doors, 
      changing room dimensions, changing architectural features, blurry, low quality, distorted, 
      unrealistic, cartoon, painting, sketch`
    formData.append('text_prompts[1][text]', negativePrompt)
    formData.append('text_prompts[1][weight]', '-1')
    
    // Configuration for preserving room structure
    formData.append('init_image_mode', 'IMAGE_STRENGTH')
    formData.append('image_strength', '0.35') // Lower = more original structure preserved
    formData.append('cfg_scale', '7')
    formData.append('samples', '1')
    formData.append('steps', '30')

    console.log('Calling Stability AI image-to-image API...')

    // Call Stability AI API
    const stabilityResponse = await fetch(
      'https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/image-to-image',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${stabilityApiKey}`,
          'Accept': 'application/json',
        },
        body: formData,
      }
    )

    if (!stabilityResponse.ok) {
      const errorText = await stabilityResponse.text()
      console.error('Stability AI generation error:', stabilityResponse.status, errorText)
      
      let errorMessage = `Stability AI generation failed: ${stabilityResponse.status}`
      let hint = ''
      
      if (stabilityResponse.status === 401) {
        errorMessage = 'Authentication failed with Stability AI. API key may be invalid.'
        hint = 'Please verify your Stability AI API key is correct and active'
      } else if (stabilityResponse.status === 402) {
        errorMessage = 'Insufficient credits for image generation.'
        hint = 'Please add credits to your Stability AI account at https://platform.stability.ai/account/credits'
      } else if (stabilityResponse.status === 429) {
        errorMessage = 'Rate limit exceeded during image generation.'
        hint = 'Wait a few minutes before trying again'
      } else if (stabilityResponse.status === 400) {
        errorMessage = 'Invalid request parameters for image generation.'
        hint = 'The image or parameters may be invalid. Try with a different image.'
      } else {
        errorMessage = `Stability AI generation error: ${stabilityResponse.status} - ${errorText}`
        hint = 'Please try again or contact support if the issue persists'
      }

      return new Response(
        JSON.stringify({
          success: false,
          error: errorMessage,
          timestamp: new Date().toISOString(),
          hint: hint
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      )
    }

    const result = await stabilityResponse.json()
    console.log('Stability AI generation completed successfully')
    
    if (!result.artifacts || result.artifacts.length === 0) {
      console.error('No artifacts in Stability AI response:', result)
      return new Response(
        JSON.stringify({
          success: false,
          error: 'No image generated by Stability AI. The generation may have failed.',
          timestamp: new Date().toISOString(),
          hint: 'Try again with a different image or style'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      )
    }

    // Get the base64 image from the response
    const generatedImage = result.artifacts[0]
    const imageBase64 = generatedImage.base64

    console.log('Generated image received, uploading to Supabase Storage...')

    // Upload the transformed image to Supabase Storage
    const { createClient } = await import('npm:@supabase/supabase-js@2')
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Convert base64 to blob
    const imageBuffer = Uint8Array.from(atob(imageBase64), c => c.charCodeAt(0))
    const imageFile = new Blob([imageBuffer], { type: 'image/png' })

    // Upload to storage
    const fileName = `transformed_${roomId}_${Date.now()}.png`
    const filePath = `transformed/${fileName}`
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('room-images')
      .upload(filePath, imageFile, {
        contentType: 'image/png',
        upsert: true,
        cacheControl: '3600'
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return new Response(
        JSON.stringify({
          success: false,
          error: `Failed to upload transformed image: ${uploadError.message}`,
          timestamp: new Date().toISOString()
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      )
    }

    console.log('Image uploaded successfully to:', uploadData.path)

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('room-images')
      .getPublicUrl(filePath)

    console.log('Public URL generated:', publicUrl)

    // Update room record with transformed image URL and style
    const { error: updateError } = await supabase
      .from('rooms')
      .update({
        transformed_image_url: publicUrl,
        interior_style: interiorStyle
      })
      .eq('id', roomId)

    if (updateError) {
      console.error('Database update error:', updateError)
      return new Response(
        JSON.stringify({
          success: false,
          error: `Failed to update room record: ${updateError.message}`,
          timestamp: new Date().toISOString()
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      )
    }

    console.log('Room transformation completed successfully for room:', roomId)

    return new Response(
      JSON.stringify({
        success: true,
        transformedImageUrl: publicUrl,
        interiorStyle: interiorStyle,
        roomId: roomId,
        message: 'Room transformation completed successfully',
        creditsUsed: 1 // Approximate credits used for this generation
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Transform room error:', error)
    
    // Provide detailed error information
    const errorResponse = {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
      hint: 'Please check the function logs for more details. If the issue persists, verify your Stability AI account status.'
    }

    return new Response(
      JSON.stringify(errorResponse),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})