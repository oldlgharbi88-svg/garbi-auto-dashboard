import { removeBackground } from '@imgly/background-removal';

interface ProcessingProgress {
  stage: string;
  progress: number;
}

const DEFAULT_PROGRESS: ProcessingProgress = {
  stage: 'Preparing image...',
  progress: 0
};

const createCanvas = (width: number, height: number) => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
};

const drawImageToCanvas = async (image: HTMLImageElement, canvas: HTMLCanvasElement) => {
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Unable to create canvas context.');
  }

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
};

const loadImageFromSource = (source: Blob | File | string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const imageUrl = typeof source === 'string' ? source : URL.createObjectURL(source);
    const img = new Image();

    img.onload = () => {
      if (typeof source !== 'string') {
        URL.revokeObjectURL(imageUrl);
      }
      resolve(img);
    };

    img.onerror = () => {
      if (typeof source !== 'string') {
        URL.revokeObjectURL(imageUrl);
      }
      reject(new Error('Unable to read the selected image.'));
    };

    img.src = imageUrl;
  });

const loadImageFromFile = (file: File): Promise<HTMLImageElement> => loadImageFromSource(file);

export const applyFilters = (canvas: HTMLCanvasElement, filters: Record<string, number> = {}) => {
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Unable to access canvas context.');
  }

  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const brightness = filters.brightness ?? 1;
  const contrast = filters.contrast ?? 1;
  const saturation = filters.saturation ?? 1;

  for (let index = 0; index < data.length; index += 4) {
    const red = data[index];
    const green = data[index + 1];
    const blue = data[index + 2];
    const alpha = data[index + 3];

    if (alpha === 0) {
      continue;
    }

    const adjustedRed = (red - 128) * contrast + 128;
    const adjustedGreen = (green - 128) * contrast + 128;
    const adjustedBlue = (blue - 128) * contrast + 128;

    const brightenedRed = adjustedRed * brightness;
    const brightenedGreen = adjustedGreen * brightness;
    const brightenedBlue = adjustedBlue * brightness;

    const grayscale = (brightenedRed * 0.299 + brightenedGreen * 0.587 + brightenedBlue * 0.114) / 255;
    const saturatedRed = brightenedRed + (brightenedRed - grayscale * 255) * (saturation - 1);
    const saturatedGreen = brightenedGreen + (brightenedGreen - grayscale * 255) * (saturation - 1);
    const saturatedBlue = brightenedBlue + (brightenedBlue - grayscale * 255) * (saturation - 1);

    data[index] = Math.max(0, Math.min(255, saturatedRed));
    data[index + 1] = Math.max(0, Math.min(255, saturatedGreen));
    data[index + 2] = Math.max(0, Math.min(255, saturatedBlue));
  }

  context.putImageData(imageData, 0, 0);
};

export const addDropShadow = (canvas: HTMLCanvasElement) => {
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Unable to access canvas context.');
  }

  const shadowCanvas = document.createElement('canvas');
  shadowCanvas.width = canvas.width;
  shadowCanvas.height = canvas.height;

  const shadowContext = shadowCanvas.getContext('2d');
  if (!shadowContext) {
    throw new Error('Unable to access shadow canvas context.');
  }

  shadowContext.drawImage(canvas, 0, 0);
  shadowContext.shadowColor = 'rgba(0, 0, 0, 0.15)';
  shadowContext.shadowBlur = 8;
  shadowContext.shadowOffsetY = 4;
  shadowContext.fillRect(0, 0, canvas.width, canvas.height);

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.drawImage(shadowCanvas, 0, 0);
};

const autoLevels = (canvas: HTMLCanvasElement) => {
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Unable to access canvas context.');
  }

  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  let min = 255;
  let max = 0;

  for (let index = 0; index < data.length; index += 4) {
    if (data[index + 3] === 0) {
      continue;
    }

    const red = data[index];
    const green = data[index + 1];
    const blue = data[index + 2];
    const brightness = (red + green + blue) / 3;
    min = Math.min(min, brightness);
    max = Math.max(max, brightness);
  }

  if (max <= min) {
    return;
  }

  const scale = 255 / (max - min);
  for (let index = 0; index < data.length; index += 4) {
    if (data[index + 3] === 0) {
      continue;
    }

    data[index] = Math.max(0, Math.min(255, (data[index] - min) * scale));
    data[index + 1] = Math.max(0, Math.min(255, (data[index + 1] - min) * scale));
    data[index + 2] = Math.max(0, Math.min(255, (data[index + 2] - min) * scale));
  }

  context.putImageData(imageData, 0, 0);
};

const sharpen = (canvas: HTMLCanvasElement) => {
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Unable to access canvas context.');
  }

  const source = context.getImageData(0, 0, canvas.width, canvas.height);
  const destination = context.createImageData(canvas.width, canvas.height);
  const kernel = [0, -1, 0, -1, 5, -1, 0, -1, 0];
  const width = canvas.width;
  const height = canvas.height;

  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const offset = (y * width + x) * 4;
      const sum = [0, 0, 0, 0];

      for (let ky = -1; ky <= 1; ky += 1) {
        for (let kx = -1; kx <= 1; kx += 1) {
          const sourceOffset = ((y + ky) * width + (x + kx)) * 4;
          const kernelValue = kernel[(ky + 1) * 3 + (kx + 1)];
          sum[0] += source.data[sourceOffset] * kernelValue;
          sum[1] += source.data[sourceOffset + 1] * kernelValue;
          sum[2] += source.data[sourceOffset + 2] * kernelValue;
          sum[3] += source.data[sourceOffset + 3] * kernelValue;
        }
      }

      destination.data[offset] = Math.max(0, Math.min(255, sum[0]));
      destination.data[offset + 1] = Math.max(0, Math.min(255, sum[1]));
      destination.data[offset + 2] = Math.max(0, Math.min(255, sum[2]));
      destination.data[offset + 3] = source.data[offset + 3];
    }
  }

  context.putImageData(destination, 0, 0);
};

const makeWhiteBackground = (image: HTMLImageElement) => {
  const canvas = createCanvas(image.width, image.height);
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Unable to create white background canvas.');
  }

  context.fillStyle = '#FFFFFF';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0);
  return canvas;
};

const cropToProduct = (image: HTMLImageElement, alphaData: Uint8ClampedArray | null, width: number, height: number) => {
  const canvas = createCanvas(width, height);
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Unable to create cropping canvas.');
  }

  if (!alphaData) {
    context.drawImage(image, 0, 0, width, height);
    return canvas;
  }

  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const alpha = alphaData[(y * width + x) * 4 + 3];
      if (alpha > 0) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }

  if (maxX <= minX || maxY <= minY) {
    context.drawImage(image, 0, 0, width, height);
    return canvas;
  }

  const padding = Math.max(8, Math.floor((maxX - minX + 1) * 0.1));
  const cropX = Math.max(0, minX - padding);
  const cropY = Math.max(0, minY - padding);
  const cropWidth = Math.min(width, maxX - minX + 1 + padding * 2);
  const cropHeight = Math.min(height, maxY - minY + 1 + padding * 2);

  const output = createCanvas(width, height);
  const outputContext = output.getContext('2d');
  if (!outputContext) {
    throw new Error('Unable to create output canvas.');
  }

  outputContext.drawImage(image, cropX, cropY, cropWidth, cropHeight, 0, 0, output.width, output.height);
  return output;
};

const canvasToBlob = (canvas: HTMLCanvasElement, type: string = 'image/png', quality: number = 0.95): Promise<Blob> =>
  new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Unable to export the processed image.'));
        return;
      }
      resolve(blob);
    }, type, quality);
  });

export const processImage = async (file: File, onProgress?: (progress: ProcessingProgress) => void): Promise<Blob> => {
  const progress = (stage: string, value: number) => {
    onProgress?.({ stage, progress: value });
  };

  try {
    progress('Removing background...', 0.15);
    const image = await loadImageFromFile(file);
    const removedBackgroundInput = (await removeBackground(image as HTMLImageElement, {
      progress: (_stage: string, value: number) => progress('Removing background...', value)
    })) as Blob | HTMLImageElement | HTMLCanvasElement;

    const removedBackground = removedBackgroundInput instanceof Blob
      ? await loadImageFromSource(removedBackgroundInput)
      : removedBackgroundInput;

    progress('Cropping and centering...', 0.45);
    const alphaCanvas = document.createElement('canvas');
    alphaCanvas.width = image.width;
    alphaCanvas.height = image.height;
    const alphaContext = alphaCanvas.getContext('2d');
    if (!alphaContext) {
      throw new Error('Unable to prepare alpha canvas.');
    }
    alphaContext.drawImage(removedBackground as CanvasImageSource, 0, 0);
    const alphaData = alphaContext.getImageData(0, 0, alphaCanvas.width, alphaCanvas.height).data;

    const productCanvas = cropToProduct(removedBackground as HTMLImageElement, alphaData, image.width, image.height);
    const displayWidth = productCanvas.width;
    const displayHeight = productCanvas.height;
    const maxDimension = 1200;
    const scale = Math.min(1, maxDimension / Math.max(displayWidth, displayHeight));
    const targetWidth = Math.max(256, Math.round(displayWidth * scale));
    const targetHeight = Math.max(256, Math.round(displayHeight * scale));

    const outputCanvas = createCanvas(targetWidth, targetHeight);
    const outputContext = outputCanvas.getContext('2d');
    if (!outputContext) {
      throw new Error('Unable to create output canvas.');
    }

    outputContext.fillStyle = '#FFFFFF';
    outputContext.fillRect(0, 0, outputCanvas.width, outputCanvas.height);
    outputContext.drawImage(productCanvas, 0, 0, outputCanvas.width, outputCanvas.height);

    progress('Enhancing image...', 0.75);
    applyFilters(outputCanvas, {
      brightness: 1.05,
      contrast: 1.10,
      saturation: 1.08
    });
    sharpen(outputCanvas);
    autoLevels(outputCanvas);

    progress('Finalizing image...', 0.95);
    addDropShadow(outputCanvas);

    const blob = await canvasToBlob(outputCanvas, 'image/png', 0.95);
    if (blob.size > 500 * 1024) {
      const compressedCanvas = createCanvas(outputCanvas.width, outputCanvas.height);
      const compressedContext = compressedCanvas.getContext('2d');
      if (!compressedContext) {
        throw new Error('Unable to compress the processed image.');
      }
      compressedContext.drawImage(outputCanvas, 0, 0);
      return canvasToBlob(compressedCanvas, 'image/png', 0.8);
    }

    return blob;
  } catch (error) {
    console.warn('Image processing failed, falling back to original image.', error);
    const originalImage = await loadImageFromFile(file);
    const fallbackCanvas = makeWhiteBackground(originalImage);
    return canvasToBlob(fallbackCanvas, 'image/png', 0.95);
  }
};
