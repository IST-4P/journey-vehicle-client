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
    // Get cookies from document.cookie and parse them
    const cookies = document.cookie.split(';').reduce((acc, cookie) => {
      const [name, value] = cookie.trim().split('=');
      acc[name] = value;
      return acc;
    }, {} as Record<string, string>);
    
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
    // Send the raw file (matches Postman binary upload)
    const response = await fetch(presignedUrl, {
      method: 'PUT',
      body: file,
      headers: {
        // Ensure object is public
        'x-amz-acl': 'public-read',
        // Safe content type
        'Content-Type': file.type || 'application/octet-stream',
      },
    });

    if (!response.ok) {
      const responseText = await response.text();
      console.error('Upload failed:', response.status, responseText);
      throw new Error(`Upload failed: ${response.status}`);
    }
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
      if (xhr.status >= 200 && xhr.status < 300) {
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
    // Step 1: Get presigned URL (like first curl command)
    const filename = generateUniqueFilename(file.name);
    
    const { presignedUrl, url } = await getPresignedUrl(filename);
    
    // Step 2: Upload file exactly like second curl command
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
    
    if (response.ok) {
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

    // Upload using raw File with minimal headers
    const response = await fetch(presignedUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'x-amz-acl': 'public-read',
        'Content-Type': file.type || 'application/octet-stream',
      },
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

      // Upload file using raw File with minimal headers
      const response = await fetch(presignedUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'x-amz-acl': 'public-read',
          'Content-Type': file.type || 'application/octet-stream',
        },
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
