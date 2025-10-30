// Test ImgBB upload functionality
import { uploadAvatarImage, uploadToImgBB, getImageUrls } from '../utils/imgbb';

// Demo function to test ImgBB upload
export async function testImgBBUpload() {
  const apiKey = import.meta.env.VITE_IMGBB_API_KEY;
  
  console.log('ImgBB API Key:', apiKey ? 'Configured' : 'Missing');
  
  // Create a small test image (1x1 pixel PNG)
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#FF0000';
    ctx.fillRect(0, 0, 1, 1);
  }
  
  return new Promise((resolve) => {
    canvas.toBlob(async (blob) => {
      if (!blob) {
        console.error('Failed to create test image');
        resolve(false);
        return;
      }
      
      const testFile = new File([blob], 'test.png', { type: 'image/png' });
      
      try {
        console.log('Testing ImgBB upload...');
        
        // Test basic upload
        const result = await uploadToImgBB(testFile, apiKey);
        console.log('ImgBB Response:', result);
        
        // Test URL extraction
        const urls = getImageUrls(result);
        console.log('Available URLs:', urls);
        
        // Test avatar upload function
        const avatarUrl = await uploadAvatarImage(testFile, apiKey);
        console.log('Avatar URL:', avatarUrl);
        
        resolve(true);
      } catch (error) {
        console.error('ImgBB test failed:', error);
        resolve(false);
      }
    }, 'image/png');
  });
}

// Add to window for console testing
if (typeof window !== 'undefined') {
  (window as any).testImgBB = testImgBBUpload;
}