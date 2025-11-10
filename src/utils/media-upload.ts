// Utility functions for uploading images using internal presigned URL API

interface PresignedUrlResponse {
  data: {
    presignedUrl: string;
    url: string;
  };
  message: string;
  statusCode: number;
}

/**
 * Get presigned URL from backend
 */
async function getPresignedUrl(filename: string): Promise<{ presignedUrl: string; url: string }> {
  try {
    console.log('Requesting presigned URL for filename:', filename);
    
    // Get cookies from document.cookie and parse them
    const cookies = document.cookie.split(';').reduce((acc, cookie) => {
      const [name, value] = cookie.trim().split('=');
      acc[name] = value;
      return acc;
    }, {} as Record<string, string>);
    
    console.log('Available cookies:', Object.keys(cookies));
    
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/media/presigned`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Accept': '*/*',
        'Accept-Language': 'vi-VN,vi;q=0.9',
        'Origin': window.location.origin,
        'Referer': window.location.href,
      },
      body: JSON.stringify({
        filename: filename
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to get presigned URL:', response.status, errorText);
      throw new Error(`Failed to get presigned URL: ${response.status}`);
    }

    const result: PresignedUrlResponse = await response.json();
    console.log('Received presigned URL response:', result);
    
    return {
      presignedUrl: result.data.presignedUrl,
      url: result.data.url
    };
  } catch (error) {
    console.error('Error getting presigned URL:', error);
    throw new Error('Không thể lấy presigned URL');
  }
}

/**
 * Upload file to presigned URL
 */
async function uploadFileToPresignedUrl(file: File, presignedUrl: string): Promise<void> {
  try {
    console.log('Uploading file to presigned URL:', presignedUrl);
    console.log('File type:', file.type, 'File size:', file.size);
    
    // Convert file to ArrayBuffer to mimic Postman's binary data approach
    const arrayBuffer = await file.arrayBuffer();
    console.log('File converted to ArrayBuffer, size:', arrayBuffer.byteLength);
    
    // Create request exactly like Postman does
    const response = await fetch(presignedUrl, {
      method: 'PUT',
      body: arrayBuffer,
      headers: {
        'Accept': '*/*',
        'Accept-Language': 'vi-VN,vi;q=0.9',
        'Origin': window.location.origin,
        'Priority': 'u=1, i',
        'Referer': window.location.href,
        'Sec-CH-UA': '"Chromium";v="142", "Brave";v="142", "Not_A Brand";v="99"',
        'Sec-CH-UA-Mobile': '?0',
        'Sec-CH-UA-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'cross-site',
        'Sec-GPC': '1',
        'User-Agent': navigator.userAgent,
        // NOTE: Intentionally NOT setting Content-Type to let browser handle it
        // This matches how Postman sends binary data without explicit content-type
      },
    });

    console.log('Upload response status:', response.status);
    console.log('Upload response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const responseText = await response.text();
      console.error('Upload failed with response:', responseText);
      
      // If first attempt fails, try with explicit Content-Type
      console.log('Trying with explicit Content-Type...');
      const response2 = await fetch(presignedUrl, {
        method: 'PUT',
        body: arrayBuffer,
        headers: {
          'Content-Type': file.type || 'application/octet-stream',
        },
      });
      
      if (!response2.ok) {
        const responseText2 = await response2.text();
        console.error('Second upload attempt failed:', responseText2);
        throw new Error(`Upload failed: ${response.status} - ${responseText}`);
      }
      
      console.log('Second upload attempt successful!');
      return;
    }
    
    console.log('File uploaded successfully!');
  } catch (error) {
    console.error('Error uploading file to presigned URL:', error);
    throw new Error('Không thể upload file');
  }
}

/**
 * Generate unique filename with timestamp and random string
 */
function generateUniqueFilename(originalName: string): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  const extension = originalName.split('.').pop();
  return `${timestamp}_${randomString}.${extension}`;
}

/**
 * Upload file using XMLHttpRequest (alternative method)
 */
async function uploadFileWithXHR(file: File, presignedUrl: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    
    xhr.open('PUT', presignedUrl);
    
    xhr.onload = function() {
      console.log('XHR Upload response status:', xhr.status);
      console.log('XHR Upload response:', xhr.responseText);
      
      if (xhr.status >= 200 && xhr.status < 300) {
        console.log('XHR Upload successful!');
        resolve();
      } else {
        reject(new Error(`XHR Upload failed: ${xhr.status} - ${xhr.responseText}`));
      }
    };
    
    xhr.onerror = function() {
      reject(new Error('XHR Upload network error'));
    };
    
    // Send file as binary data (similar to Postman)
    xhr.send(file);
  });
}

/**
 * Debug function to test exact Postman flow
 */
export async function debugPostmanFlow(file: File): Promise<void> {
  try {
    console.log('🔥 TESTING EXACT POSTMAN FLOW 🔥');
    
    // Step 1: Get presigned URL (like first curl command)
    console.log('Step 1: Getting presigned URL...');
    const filename = generateUniqueFilename(file.name);
    console.log('Generated filename:', filename);
    
    const { presignedUrl, url } = await getPresignedUrl(filename);
    console.log('Got presigned URL:', presignedUrl);
    console.log('Final URL will be:', url);
    
    // Step 2: Upload file exactly like second curl command
    console.log('Step 2: Uploading file with exact Postman headers...');
    
    // Convert to ArrayBuffer (binary data like Postman)
    const arrayBuffer = await file.arrayBuffer();
    
    const response = await fetch(presignedUrl, {
      method: 'PUT',
      body: arrayBuffer,
      headers: {
        'Accept': '*/*',
        'Accept-Language': 'vi-VN,vi;q=0.9',
        'Origin': window.location.origin,
        'Priority': 'u=1, i',
        'Referer': window.location.href,
        'Sec-CH-UA': '"Chromium";v="142", "Brave";v="142", "Not_A Brand";v="99"',
        'Sec-CH-UA-Mobile': '?0', 
        'Sec-CH-UA-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors', 
        'Sec-Fetch-Site': 'cross-site',
        'Sec-GPC': '1',
        'User-Agent': navigator.userAgent
        // NO Content-Type header - let browser handle it
      }
    });
    
    console.log('Upload response status:', response.status);
    console.log('Upload response headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      console.log('🎉 POSTMAN FLOW SUCCESSFUL! 🎉');
      console.log('Final image URL:', url);
    } else {
      const errorText = await response.text();
      console.error('❌ Upload failed:', response.status, errorText);
      throw new Error(`Upload failed: ${response.status}`);
    }
    
  } catch (error) {
    console.error('❌ Postman flow failed:', error);
    throw error;
  }
}

/**
 * Upload avatar image using presigned URL
 */
export async function uploadAvatarImage(file: File): Promise<string> {
  try {
    // Validate file
    if (!file.type.startsWith('image/')) {
      throw new Error('File phải là hình ảnh');
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      throw new Error('Kích thước file không được vượt quá 10MB');
    }

    // Generate unique filename
    const uniqueFilename = generateUniqueFilename(file.name);

    // Get presigned URL
    const { presignedUrl, url } = await getPresignedUrl(uniqueFilename);

    // Upload using the exact same method that works in debugPostmanFlow
    const arrayBuffer = await file.arrayBuffer();
    
    const response = await fetch(presignedUrl, {
      method: 'PUT',
      body: arrayBuffer,
      headers: {
        'Accept': '*/*',
        'Accept-Language': 'vi-VN,vi;q=0.9',
        'Origin': window.location.origin,
        'Priority': 'u=1, i',
        'Referer': window.location.href,
        'Sec-CH-UA': '"Chromium";v="142", "Brave";v="142", "Not_A Brand";v="99"',
        'Sec-CH-UA-Mobile': '?0',
        'Sec-CH-UA-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'cross-site',
        'Sec-GPC': '1',
        'User-Agent': navigator.userAgent
        // NO Content-Type header - let browser handle it automatically
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Upload failed:', response.status, errorText);
      throw new Error(`Upload failed: ${response.status}`);
    }

    // Return the final URL for displaying
    return url;
  } catch (error) {
    console.error('Error uploading avatar:', error);
    throw error;
  }
}

/**
 * Upload multiple license images using presigned URL
 */
export async function uploadLicenseImages(files: File[]): Promise<string[]> {
  try {
    const uploadPromises = files.map(async (file, index) => {
      // Validate file
      if (!file.type.startsWith('image/')) {
        throw new Error(`File ${index + 1} phải là hình ảnh`);
      }

      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error(`File ${index + 1} không được vượt quá 10MB`);
      }

      // Generate unique filename
      const uniqueFilename = generateUniqueFilename(file.name);

      // Get presigned URL
      const { presignedUrl, url } = await getPresignedUrl(uniqueFilename);

      // Upload file using the exact same method that works
      const arrayBuffer = await file.arrayBuffer();
      
      const response = await fetch(presignedUrl, {
        method: 'PUT',
        body: arrayBuffer,
        headers: {
          'Accept': '*/*',
          'Accept-Language': 'vi-VN,vi;q=0.9',
          'Origin': window.location.origin,
          'Priority': 'u=1, i',
          'Referer': window.location.href,
          'Sec-CH-UA': '"Chromium";v="142", "Brave";v="142", "Not_A Brand";v="99"',
          'Sec-CH-UA-Mobile': '?0',
          'Sec-CH-UA-Platform': '"Windows"',
          'Sec-Fetch-Dest': 'empty',
          'Sec-Fetch-Mode': 'cors',
          'Sec-Fetch-Site': 'cross-site',
          'Sec-GPC': '1',
          'User-Agent': navigator.userAgent
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Upload failed:', response.status, errorText);
        throw new Error(`Upload failed: ${response.status}`);
      }

      // Return the final URL for displaying
      return url;
    });

    // Wait for all uploads to complete
    const urls = await Promise.all(uploadPromises);
    return urls;
  } catch (error) {
    console.error('Error uploading license images:', error);
    throw error;
  }
}