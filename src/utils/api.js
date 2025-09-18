// Utility function for making authenticated API requests
export const apiRequest = async (endpoint, options = {}) => {
  const defaultOptions = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
    },
    mode: 'cors',
  };

  // Merge default options with provided options
  const requestOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...(options.headers || {}),
    },
  };

  try {
    const url = `https://arkanaltafawuq.com/arkan-system/${endpoint}`;
    console.log('API Request:', {
      url,
      method: requestOptions.method || 'GET',
      headers: requestOptions.headers,
      body: requestOptions.body,
      credentials: requestOptions.credentials,
    });
    
    const response = await fetch(url, requestOptions);
    
    // Log response headers for debugging
    const responseHeaders = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });
    console.log('API Response Headers:', responseHeaders);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    // Try to parse as JSON, fallback to text if not valid JSON
    try {
      return await response.json();
    } catch (e) {
      const text = await response.text();
      if (text.includes('success') || text.includes('updated')) {
        return { success: true };
      }
      return { success: true, data: text };
    }
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};
