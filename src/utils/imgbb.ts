// ImgBB API helper functions

interface ImgBBResponse {
  data: {
    id: string;
    title: string;
    url_viewer: string;
    url: string;
    display_url: string;
    width: string;
    height: string;
    size: string;
    time: string;
    expiration: string;
    image: {
      filename: string;
      name: string;
      mime: string;
      extension: string;
      url: string;
    };
    thumb?: {
      filename: string;
      name: string;
      mime: string;
      extension: string;
      url: string;
    };
    medium?: {
      filename: string;
      name: string;
      mime: string;
      extension: string;
      url: string;
    };
    delete_url: string;
  };
  success: boolean;
  status: number;
}

interface ImageUrls {
  original: string;
  display: string;
  thumb?: string;
  medium?: string;
  viewer: string;
  deleteUrl: string;
}

/**
 * Upload image to ImgBB service
 * @param file - The image file to upload
 * @param apiKey - ImgBB API key
 * @param expiration - Expiration time in seconds (optional, 60-15552000)
 * @returns ImgBB response object
 */
export async function uploadToImgBB(
  file: File, 
  apiKey: string, 
  expiration?: number
): Promise<ImgBBResponse> {
  // Validate file size (32MB max)
  if (file.size > 32 * 1024 * 1024) {
    throw new Error('File quá lớn! ImgBB chỉ hỗ trợ file nhỏ hơn 32MB');
  }

  // Validate file type
  if (!file.type.startsWith('image/')) {
    throw new Error('Vui lòng chọn file hình ảnh');
  }

  // Prepare form data
  const formData = new FormData();
  formData.append('image', file);

  // Build URL with parameters
  let url = `https://api.imgbb.com/1/upload?key=${apiKey}`;
  if (expiration) {
    url += `&expiration=${expiration}`;
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: ImgBBResponse = await response.json();

    if (!result.success) {
      throw new Error('ImgBB upload failed');
    }

    return result;
  } catch (error) {
    console.error('ImgBB upload error:', error);
    throw error;
  }
}

/**
 * Get different size URLs from ImgBB response
 * @param imgbbResponse - ImgBB API response
 * @returns Object containing different size URLs
 */
export function getImageUrls(imgbbResponse: ImgBBResponse): ImageUrls {
  const data = imgbbResponse.data;
  
  return {
    original: data.url,
    display: data.display_url,
    thumb: data.thumb?.url,
    medium: data.medium?.url,
    viewer: data.url_viewer,
    deleteUrl: data.delete_url
  };
}

/**
 * Upload image and get optimized URL for avatar use
 * @param file - The image file to upload
 * @param apiKey - ImgBB API key
 * @returns The best URL for avatar display
 */
export async function uploadAvatarImage(file: File, apiKey: string): Promise<string> {
  const result = await uploadToImgBB(file, apiKey);
  const urls = getImageUrls(result);

  // Return medium size for avatars, fallback to display URL
  return urls.medium || urls.display || urls.original;
}

/**
 * Upload driver license image and get URL
 * @param file - The license image file to upload
 * @param apiKey - ImgBB API key
 * @returns The URL for license image display
 */
export async function uploadLicenseImage(file: File, apiKey: string): Promise<string> {
  const result = await uploadToImgBB(file, apiKey);
  const urls = getImageUrls(result);

  // Return display URL for license images
  return urls.display || urls.original;
}

/**
 * Upload multiple license images (front, back, selfie)
 * @param files - Object containing license image files
 * @param apiKey - ImgBB API key
 * @returns Object containing URLs for each image type
 */
export async function uploadLicenseImages(
  files: {
    front?: File;
    back?: File;
    selfie?: File;
  },
  apiKey: string
): Promise<{
  front?: string;
  back?: string;
  selfie?: string;
}> {
  const result: {
    front?: string;
    back?: string;
    selfie?: string;
  } = {};

  // Upload front image
  if (files.front) {
    result.front = await uploadLicenseImage(files.front, apiKey);
  }

  // Upload back image
  if (files.back) {
    result.back = await uploadLicenseImage(files.back, apiKey);
  }

  // Upload selfie image
  if (files.selfie) {
    result.selfie = await uploadLicenseImage(files.selfie, apiKey);
  }

  return result;
}