// ===== ЗУРАГ UPLOAD: COMPRESSION + THUMBNAIL (Canvas ашиглан, client-side) =====

// File-г canvas-аар дамжуулж хэмжээг багасгаад JPEG blob болгоно
function compressImage(file, maxWidth, maxHeight, quality) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Файл уншихад алдаа гарлаа"));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error("Зураг ачаалахад алдаа гарлаа"));
      img.onload = () => {
        let { width, height } = img;
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("Compression алдаа")), "image/jpeg", quality);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

// Үндсэн (1200px, 82%) + thumbnail (300px, 70%) хувилбар бэлдэнэ
async function prepareImageForUpload(file) {
  if (!file.type.startsWith("image/")) throw new Error("Зөвхөн зураг файл оруулна уу");
  const [full, thumb] = await Promise.all([
    compressImage(file, 1200, 1200, 0.82),
    compressImage(file, 300, 300, 0.7),
  ]);
  return { full, thumb };
}

async function uploadBlobToStorage(path, blob) {
  if (!storage) throw new Error("Firebase Storage холбогдоогүй байна");
  const ref = storage.ref(path);
  await ref.put(blob, { contentType: "image/jpeg" });
  return ref.getDownloadURL();
}

// basePath: extension-гүй жишээ нь "movies/abc123/poster" — .jpg болон _thumb.jpg автоматаар нэмэгдэнэ
async function uploadImageWithThumbnail(basePath, file, onProgress) {
  if (onProgress) onProgress("compress");
  const { full, thumb } = await prepareImageForUpload(file);
  if (onProgress) onProgress("upload");
  const [url, thumbUrl] = await Promise.all([
    uploadBlobToStorage(basePath + ".jpg", full),
    uploadBlobToStorage(basePath + "_thumb.jpg", thumb),
  ]);
  if (onProgress) onProgress("done");
  return { url, thumbUrl };
}
