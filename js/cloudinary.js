/* ============================================
   LOVEFLIX — Cloudinary Integration
   Unsigned uploads from the browser
   ============================================ */

const LoveFlixCloud = (() => {
  /**
   * Upload a file to Cloudinary with progress tracking
   * @param {File} file - The file to upload
   * @param {Function} onProgress - Progress callback (0-100)
   * @param {string} resourceType - 'image' or 'video'
   * @returns {Promise<Object>} Upload result
   */
  function upload(file, onProgress = () => {}, resourceType = 'auto') {
    return new Promise((resolve, reject) => {
      const config = window.LoveFlixConfig?.cloudinary;
      if (!config || config.cloudName === 'YOUR_CLOUD_NAME') {
        reject(new Error('Cloudinary not configured. Update js/config.js'));
        return;
      }

      // Validate file
      const validation = validateFile(file);
      if (!validation.valid) {
        reject(new Error(validation.error));
        return;
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', config.uploadPreset);
      formData.append('folder', config.folder);

      const xhr = new XMLHttpRequest();
      const url = `https://api.cloudinary.com/v1_1/${config.cloudName}/${resourceType}/upload`;

      xhr.open('POST', url);

      // Track upload progress
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          onProgress(percent);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          resolve({
            url: response.secure_url,
            publicId: response.public_id,
            thumbnail: generateThumbnail(response.secure_url, response.resource_type),
            width: response.width,
            height: response.height,
            format: response.format,
            duration: response.duration || null,
            bytes: response.bytes,
            resourceType: response.resource_type,
            createdAt: response.created_at
          });
        } else {
          reject(new Error(`Upload failed: ${xhr.statusText}`));
        }
      });

      xhr.addEventListener('error', () => reject(new Error('Upload failed: Network error')));
      xhr.addEventListener('abort', () => reject(new Error('Upload cancelled')));

      xhr.send(formData);
    });
  }

  /**
   * Validate file type and size
   */
  function validateFile(file) {
    const config = window.LoveFlixConfig?.cloudinary;
    const ext = file.name.split('.').pop().toLowerCase();
    const isImage = config.allowedImageFormats.includes(ext);
    const isVideo = config.allowedVideoFormats.includes(ext);

    if (!isImage && !isVideo) {
      return { valid: false, error: `Unsupported format: .${ext}` };
    }

    if (file.size > config.maxFileSize) {
      const maxMB = Math.round(config.maxFileSize / (1024 * 1024));
      return { valid: false, error: `File too large. Max size: ${maxMB}MB` };
    }

    return { valid: true, type: isImage ? 'image' : 'video' };
  }

  /**
   * Generate optimized thumbnail URL using Cloudinary transforms
   */
  function generateThumbnail(url, resourceType) {
    if (!url) return '';
    const config = window.LoveFlixConfig?.cloudinary;
    const w = config?.thumbnailWidth || 400;
    const h = config?.thumbnailHeight || 225;

    if (resourceType === 'video') {
      // Video thumbnail: grab frame at 2s mark
      return url.replace('/upload/', `/upload/w_${w},h_${h},c_fill,so_2/`).replace(/\.\w+$/, '.jpg');
    }
    // Image thumbnail
    return url.replace('/upload/', `/upload/w_${w},h_${h},c_fill,q_auto,f_auto/`);
  }

  /**
   * Generate optimized URL for display
   */
  function optimizeUrl(url, width = 800) {
    if (!url) return '';
    return url.replace('/upload/', `/upload/w_${width},q_auto,f_auto/`);
  }

  /**
   * Generate streaming-optimized video URL
   */
  function streamingUrl(url) {
    if (!url) return '';
    return url.replace('/upload/', '/upload/q_auto/');
  }

  /**
   * Delete a resource by public ID (requires server - for reference only)
   * Note: Deletion via unsigned requests is not supported by Cloudinary.
   * This would need a server-side function or Cloudinary admin API.
   */
  function deleteResource(publicId) {
    console.warn('[LoveFlix] Client-side deletion not supported. Use Cloudinary dashboard.');
    return Promise.resolve(false);
  }

  /**
   * Get file type from extension
   */
  function getFileType(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    const config = window.LoveFlixConfig?.cloudinary;
    if (config?.allowedImageFormats.includes(ext)) return 'image';
    if (config?.allowedVideoFormats.includes(ext)) return 'video';
    return 'unknown';
  }

  return {
    upload,
    validateFile,
    generateThumbnail,
    optimizeUrl,
    streamingUrl,
    deleteResource,
    getFileType
  };
})();

window.LoveFlixCloud = LoveFlixCloud;
