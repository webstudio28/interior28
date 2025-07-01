const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Testing Stability AI API configuration...')
    
    const stabilityApiKey = Deno.env.get('STABILITY_API_KEY')
    
    if (!stabilityApiKey) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'STABILITY_API_KEY not configured',
          type: 'configuration',
          timestamp: new Date().toISOString(),
          hint: 'Go to your Supabase project → Edge Functions → test-stability → Settings and add STABILITY_API_KEY environment variable'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200, // Return 200 so we can read the error details
        }
      )
    }

    console.log('API Key found, testing with Stability AI...')

    // Test the API key by making a simple request to get account info
    const testResponse = await fetch('https://api.stability.ai/v1/user/account', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${stabilityApiKey}`,
        'Accept': 'application/json',
      },
    })

    console.log('Stability AI response status:', testResponse.status)

    if (!testResponse.ok) {
      const errorText = await testResponse.text()
      console.log('Stability AI error response:', errorText)
      
      let errorType = 'unknown'
      let errorMessage = `API request failed: ${testResponse.status}`
      let hint = ''
      
      if (testResponse.status === 401) {
        errorType = 'invalid_key'
        errorMessage = 'Invalid API key. The STABILITY_API_KEY is not valid or has been revoked.'
        hint = 'Please check your Stability AI API key in your account dashboard at https://platform.stability.ai/account/keys'
      } else if (testResponse.status === 402) {
        errorType = 'insufficient_credits'
        errorMessage = 'Insufficient credits. Your Stability AI account does not have enough credits.'
        hint = 'Please add credits to your Stability AI account at https://platform.stability.ai/account/credits'
      } else if (testResponse.status === 429) {
        errorType = 'rate_limit'
        errorMessage = 'Rate limit exceeded. Too many requests.'
        hint = 'Wait a few minutes before trying again'
      } else if (testResponse.status === 403) {
        errorType = 'forbidden'
        errorMessage = 'Access forbidden. Your API key may not have the required permissions.'
        hint = 'Check your API key permissions in your Stability AI account'
      } else {
        errorType = 'api_error'
        errorMessage = `Stability AI API error: ${testResponse.status} - ${errorText}`
        hint = 'Please check the Stability AI service status or try again later'
      }

      return new Response(
        JSON.stringify({
          success: false,
          error: errorMessage,
          type: errorType,
          statusCode: testResponse.status,
          timestamp: new Date().toISOString(),
          hint: hint,
          debugInfo: {
            apiKeyPrefix: stabilityApiKey.substring(0, 8) + '...',
            responseText: errorText.substring(0, 200) // First 200 chars for debugging
          }
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200, // Return 200 so we can read the error details
        }
      )
    }

    // If we get here, the API key is valid and account is accessible
    const accountData = await testResponse.json()
    console.log('Account data received:', accountData)

    // Also test the engines endpoint to make sure we can access generation endpoints
    console.log('Testing engines endpoint...')
    const enginesResponse = await fetch('https://api.stability.ai/v1/engines/list', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${stabilityApiKey}`,
        'Accept': 'application/json',
      },
    })

    let enginesInfo = 'Unable to fetch engines'
    if (enginesResponse.ok) {
      const enginesData = await enginesResponse.json()
      enginesInfo = `${enginesData.length || 0} engines available`
      console.log('Engines available:', enginesData.length)
    } else {
      console.log('Engines endpoint failed:', enginesResponse.status)
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Stability AI API is properly configured and accessible',
        accountInfo: {
          credits: accountData.credits || 'Unknown',
          engines: enginesInfo,
          // Don't expose sensitive account details
        },
        timestamp: new Date().toISOString(),
        debugInfo: {
          apiKeyPrefix: stabilityApiKey.substring(0, 8) + '...',
          accountEndpoint: 'OK',
          enginesEndpoint: enginesResponse.ok ? 'OK' : 'Failed'
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Test error:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        type: 'unexpected',
        timestamp: new Date().toISOString(),
        hint: 'An unexpected error occurred during testing. Check the function logs for more details.'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200, // Return 200 so we can read the error details
      }
    )
  }
})