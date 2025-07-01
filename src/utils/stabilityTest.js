// Utility to test Stability AI API without making actual transformations
// This will help verify if the issue is credits, API key, or configuration

export const testStabilityAPI = async () => {
  try {
    // Test the Stability AI API with a minimal request to check account status
    const response = await fetch('/api/test-stability', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ test: true })
    })

    const result = await response.json()
    return result
  } catch (error) {
    return {
      success: false,
      error: error.message,
      type: 'network'
    }
  }
}