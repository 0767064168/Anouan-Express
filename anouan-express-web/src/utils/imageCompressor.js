// src/utils/imageCompressor.js
// Compression d'images intelligente côté client pour réseau mobile ivoirien (2G/3G/4G)

export const compressImage = (file, options = {}) => {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/') || file.size < 150 * 1024) {
      return resolve(file);
    }

    const {
      maxWidth = 1280,
      maxHeight = 1280,
      quality = 0.82,
      outputType = 'image/jpeg'
    } = options;

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) return resolve(file);

            const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
              type: outputType,
              lastModified: Date.now()
            });

            resolve(compressedFile);
          },
          outputType,
          quality
        );
      };

      img.onerror = (err) => reject(err);
    };

    reader.onerror = (err) => reject(err);
  });
};
