// Debug utility to test presigned URL upload
export async function debugPresignedUpload() {
  try {
    // Create a simple test file
    const testContent = 'Hello, this is a test image';
    const testBlob = new Blob([testContent], { type: 'text/plain' });
    const testFile = new File([testBlob], 'test-debug.txt', { type: 'text/plain' });
    
    console.log('=== DEBUG: Testing presigned URL upload ===');
    console.log('Test file:', testFile);
    
    // Step 1: Get presigned URL
    console.log('Step 1: Getting presigned URL...');
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/media/presigned`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filename: testFile.name
      })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get presigned URL: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('Presigned URL response:', result);
    
    // Step 2a: Upload to presigned URL using fetch
    console.log('Step 2a: Uploading to presigned URL using fetch...');
    const arrayBuffer = await testFile.arrayBuffer();
    
    const uploadResponse = await fetch(result.data.presignedUrl, {
      method: 'PUT',
      body: arrayBuffer
    });
    
    console.log('Fetch upload response status:', uploadResponse.status);
    console.log('Fetch upload response headers:', Object.fromEntries(uploadResponse.headers.entries()));
    
    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('Fetch upload error response:', errorText);
      
      // Step 2b: Try XMLHttpRequest if fetch fails
      console.log('Step 2b: Trying XMLHttpRequest method...');
      
      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', result.data.presignedUrl);
        
        xhr.onload = function() {
          console.log('XHR upload response status:', xhr.status);
          console.log('XHR upload response text:', xhr.responseText);
          
          if (xhr.status >= 200 && xhr.status < 300) {
            console.log('XHR upload successful!');
            resolve(undefined);
          } else {
            reject(new Error(`XHR upload failed: ${xhr.status}`));
          }
        };
        
        xhr.onerror = () => reject(new Error('XHR network error'));
        xhr.send(testFile);
      });
    }
    
    console.log('✅ Upload successful!');
    console.log('Final URL should be:', result.data.url);
    
    return result.data.url;
  } catch (error) {
    console.error('❌ Debug upload failed:', error);
    throw error;
  }
}

// Make it available globally for testing
if (typeof window !== 'undefined') {
  (window as any).debugPresignedUpload = debugPresignedUpload;
}