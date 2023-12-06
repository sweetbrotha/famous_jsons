// import * as d3 from 'd3';
export const MAX_DIMENSION = 150;
export const MAX_CHAR_SIZE = 14;
export const MAX_IMAGE_SIZE = MAX_CHAR_SIZE * MAX_DIMENSION;
export const FONT_SIZE_INCREASE = 2;
export const FONT_SIZE = MAX_CHAR_SIZE + FONT_SIZE_INCREASE;
export const FONT = `${FONT_SIZE}px Power`;
export const CHAR_PADDING = 1;
export const SPACE_PADDING = 2 * CHAR_PADDING;
export const TILE_HEIGHT = 50;
export const LOGO_PADDING = MAX_CHAR_SIZE * 5;

const fontCanvas = document.createElement('canvas');
const fontContext = fontCanvas.getContext('2d');

const escapeXml = (string) => {
  return string
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};

export const resizeImage = (uploadedImage, callback) => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  const image = new Image();
  image.src = URL.createObjectURL(uploadedImage);

  image.onload = () => {
    let width = image.width;
    let height = image.height;

    if (width > height) {
      if (width > MAX_DIMENSION) { // resize needed
        height *= MAX_DIMENSION / width;
        width = MAX_DIMENSION;
      }
    } else {
      if (height > MAX_DIMENSION) { // resize needed
        width *= MAX_DIMENSION / height;
        height = MAX_DIMENSION;
      }
    }

    width = Math.round(width);
    height = Math.round(height);

    // Set canvas dimensions, draw image with those dimensions
    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(image, 0, 0, width, height);

    // Get the resized image from the canvas as a blob
    canvas.toBlob((blob) => { callback(blob); }, uploadedImage.type);
  };
};

const getTextWidth = (text) => {
  fontContext.font = FONT;
  return fontContext.measureText(text).width;
};

export const drawMosaic = async (uploadedImage, inputText, background, callback) => {
  const image = new Image();
  image.src = URL.createObjectURL(uploadedImage);
  await new Promise((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error('Image could not be loaded'));
  });
  await privateDrawMosaic(image, inputText, background, callback);
}

// common mosaic drawing logic
const privateDrawMosaic = async (image, inputText, background, callback) => {
  const originalCanvas = document.createElement('canvas');
  originalCanvas.width = image.width;
  originalCanvas.height = image.height;
  const svgWidth = image.width * MAX_CHAR_SIZE;
  const svgHeight = image.height * MAX_CHAR_SIZE;
  const originalCtx = originalCanvas.getContext('2d', { willReadFrequently: true });
  originalCtx.drawImage(image, 0, 0);

  const numberOfTiles = Math.ceil(image.height / TILE_HEIGHT);
  inputText = inputText.replace(/\s+/g, ' '); // clean whitespace
  let textIndex = 0; // start reading inputText at beginning
  let svgContent = ""; // initialize SVG content accumulator
  if (background === "white") {
    svgContent += `<rect width="${svgWidth}" height="${svgHeight}" fill="white"/>`;
  } else if (background === "black") {
    svgContent += `<rect width="${svgWidth}" height="${svgHeight}" fill="black"/>`;
  }
  for (let t = 0; t < numberOfTiles; t++) {
    const yIndex = t * TILE_HEIGHT;
    const tileHeight = Math.min(TILE_HEIGHT, image.height - yIndex);
    const { newTextIndex, tileSvg } = processTile(originalCtx, image, yIndex, tileHeight, inputText, textIndex, svgWidth);
    textIndex = newTextIndex; // update where we are in the text loop
    svgContent += tileSvg; // append SVG content of the current tile
  }

  callback(svgContent, { width: svgWidth, height: svgHeight });
};

const processTile = (originalCtx, image, yIndex, tileHeight, inputText, textIndex, svgWidth) => {
  const imageData = originalCtx.getImageData(0, 0, image.width, image.height).data;
  let tileSvg = `<g font-family="Power" font-size="${FONT_SIZE}px" alignment-baseline="middle">`;
  let yPosition = (yIndex * MAX_CHAR_SIZE);

  for (let textLine = 0; textLine < tileHeight; textLine++) {
    let currentLineWidth = 0;
    let lineText = '';

    while (currentLineWidth < svgWidth) {
      if (textIndex >= inputText.length) textIndex = 0; // loop around the text
      const char = inputText.charAt(textIndex);
      const charWidth = char === ' ' ? SPACE_PADDING : getTextWidth(char) + CHAR_PADDING;
      if (currentLineWidth + charWidth > svgWidth) break; // line is filled, go no further
      lineText += char;
      currentLineWidth += charWidth;
      textIndex++;
    }

    // Center the line
    const startX = (svgWidth - currentLineWidth) / 2;
    let xPosition = startX;

    for (const char of lineText) {
      if (char !== ' ') {
        const charWidth = getTextWidth(char);
        const escapedChar = escapeXml(char);
        const xRatio = (xPosition + (MAX_CHAR_SIZE / 2)) / svgWidth;
        const yRatio = (yPosition + (MAX_CHAR_SIZE / 2)) / (image.height * MAX_CHAR_SIZE);
        const pixelX = Math.floor(image.width * xRatio);
        const pixelY = Math.floor(image.height * yRatio);
        const pixelIndex = (pixelY * image.width + pixelX) * 4;

        const pixelColor = `rgba(${imageData[pixelIndex]}, ${imageData[pixelIndex + 1]}, ${imageData[pixelIndex + 2]}, ${imageData[pixelIndex + 3] / 255})`;

        tileSvg += `<text x="${xPosition}" y="${yPosition + MAX_CHAR_SIZE}" fill="${pixelColor}">${escapedChar}</text>`;
        xPosition += charWidth + CHAR_PADDING;
      } else {
        xPosition += SPACE_PADDING;
      }
    }

    yPosition += MAX_CHAR_SIZE; // next line
  }

  tileSvg += '</g>';
  return { newTextIndex: textIndex, tileSvg };
};