interface ImageDimensions {
  width: number;
  height: number;
}

interface ResizedImage {
  data: string;
  name: string;
  type: string;
}

export const resizeImage = async (
  file: File,
  maxWidth: number = 1000,
  maxHeight: number = 1000
): Promise<ResizedImage> => {
  return new Promise((resolve) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e: ProgressEvent<FileReader>) => {
      if (e.target?.result) {
        img.src = e.target.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let { width, height } = calculateDimensions(
            img.width,
            img.height,
            maxWidth,
            maxHeight
          );

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) throw new Error('Could not get canvas context');
          ctx.drawImage(img, 0, 0, width, height);

          const resizedDataUrl = canvas.toDataURL(file.type, 0.7);
          resolve({
            data: resizedDataUrl,
            name: file.name,
            type: file.type,
          });
        };
      }
    };
    reader.readAsDataURL(file);
  });
};

export const captureScreenshot = async (
  maxWidth: number = 1000,
  maxHeight: number = 1000
): Promise<ResizedImage> => {
  const stream = await navigator.mediaDevices.getDisplayMedia({
    preferCurrentTab: true,
    video: {
      displaySurface: 'browser',
    } as MediaTrackConstraints,
  });

  const video = document.createElement('video');
  video.srcObject = stream;

  await new Promise<void>((resolve) => {
    video.onloadedmetadata = () => resolve();
  });
  video.play();

  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');
  ctx.drawImage(video, 0, 0);

  // Stop all tracks
  stream.getTracks().forEach((track) => track.stop());

  // Resize the screenshot
  let { width, height } = calculateDimensions(
    canvas.width,
    canvas.height,
    maxWidth,
    maxHeight
  );

  const resizedCanvas = document.createElement('canvas');
  resizedCanvas.width = width;
  resizedCanvas.height = height;
  const resizedCtx = resizedCanvas.getContext('2d');
  if (!resizedCtx) throw new Error('Could not get canvas context');
  resizedCtx.drawImage(canvas, 0, 0, width, height);

  return {
    data: resizedCanvas.toDataURL('image/jpeg', 0.7),
    name: 'screenshot.jpg',
    type: 'image/jpeg',
  };
};

const calculateDimensions = (
  width: number,
  height: number,
  maxWidth: number,
  maxHeight: number
): ImageDimensions => {
  if (width > height) {
    if (width > maxWidth) {
      height *= maxWidth / width;
      width = maxWidth;
    }
  } else {
    if (height > maxHeight) {
      width *= maxHeight / height;
      height = maxHeight;
    }
  }
  return { width, height };
};