import React, { useState, useEffect } from 'react';

const SessionTest = () => {
  const [status, setStatus] = useState('Not started');
  const [sessionData, setSessionData] = useState(null);
  const [error, setError] = useState(null);

  const testLogin = async () => {
    try {
      setStatus('Testing login...');
      const response = await fetch('https://arkanaltafawuq.com/arkan-system/login.php', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          username: 'admin',  // Replace with actual test credentials
          password: 'admin123'  // Replace with actual test password
        })
      });

      const data = await response.json();
      console.log('Login response:', data);
      
      if (data.success) {
        setStatus('Login successful');
        testSession();
      } else {
        setStatus(`Login failed: ${data.message}`);
        setError(data);
      }
    } catch (err) {
      console.error('Login test error:', err);
      setStatus('Login test failed');
      setError(err.toString());
    }
  };

  const testSession = async () => {
    try {
      setStatus('Testing session...');
      const response = await fetch('https://arkanaltafawuq.com/arkan-system/edit_client.php', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          id: 1,  // Test with a valid client ID
          name: 'Test Client',
          balance: 1000,
          // Include other required fields
        })
      });

      const data = await response.text();
      console.log('Session test response:', data);
      
      try {
        const jsonData = JSON.parse(data);
        setSessionData(jsonData);
        setStatus(jsonData.success ? 'Session test successful' : `Error: ${jsonData.message}`);
      } catch (e) {
        setSessionData(data);
        setStatus('Received non-JSON response');
      }
    } catch (err) {
      console.error('Session test error:', err);
      setStatus('Session test failed');
      setError(err.toString());
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h2>Session Test</h2>
      <button 
        onClick={testLogin}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          margin: '10px 0',
          cursor: 'pointer'
        }}
      >
        Test Login & Session
      </button>
      
      <div style={{ marginTop: '20px' }}>
        <h3>Status: {status}</h3>
        {error && (
          <div style={{ color: 'red', margin: '10px 0' }}>
            <strong>Error:</strong> {error}
          </div>
        )}
        {sessionData && (
          <div style={{ marginTop: '20px' }}>
            <h4>Response Data:</h4>
            <pre style={{
              background: '#f5f5f5',
              padding: '15px',
              borderRadius: '4px',
              overflowX: 'auto'
            }}>
              {JSON.stringify(sessionData, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default SessionTest;
