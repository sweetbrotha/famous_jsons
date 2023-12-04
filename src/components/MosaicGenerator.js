// import * as d3 from 'd3';
export const MAX_DIMENSION = 150;
export const MAX_CHAR_SIZE = 14;
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
  // let jsonName = null;

  // if (fj) {
  //   jsonName = inputText;
  //   try {
  //     // Attempt to load the JSON text
  //     const textResponse = await fetch(`/json_json/${jsonName}.json`);
  //     if (!textResponse.ok) throw new Error(`Text file not found: ${jsonName}.json`);
  //     inputText = await textResponse.text();

  //     // Attempt to load the image, trying both .jpeg and .jpg extensions
  //     let imageResponse = await fetch(`/json_images/${jsonName}.jpg`);
  //     if (!imageResponse.ok) {
  //       throw new Error(`Image file not found: ${jsonName}.jpg`);
  //     }

  //     const imageBlob = await imageResponse.blob();
  //     // Resize the image before proceeding
  //     resizeImage(imageBlob, async (resizedImageBlob) => {
  //       const resizedImage = new File([resizedImageBlob], "resized_image.jpeg", { type: "image/jpeg" });
  //       const image = new Image();
  //       image.src = URL.createObjectURL(resizedImage);
  //       await new Promise((resolve, reject) => {
  //         image.onload = () => resolve();
  //         image.onerror = () => reject(new Error('Image could not be loaded'));
  //       });
  //       await privateDrawMosaic(image, inputText, background, jsonName, callback);
  //     });

  //   } catch (error) {
  //     console.error(error);
  //     alert(`An error occurred: ${error.message}`);
  //   }
  // } else {
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

  // const logoSvg = await getLogoXml(svgWidth, svgHeight, jsonName);
  // svgContent += logoSvg;
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

// const getLogoXml = async (svgWidth, svgHeight, jsonName) => {
//   let logoSvgPart = '';
//   let bannerSvgPart = '';
//   if (jsonName) { // no json, no overlays
//     try {
//       // ##### TOP RIGHT LOGO #####
//       const logoResponse = await fetch('/logo_art.svg');
//       const logoSvgText = await logoResponse.text();
//       // Create a D3 selection from the SVG text
//       const logoSelection = d3.create("svg")
//         .html(logoSvgText)
//         .select("svg");

//       // Extract the viewBox values
//       const viewBox = logoSelection.attr("viewBox").split(' ').map(Number);
//       const [vbX, vbY, vbWidth, vbHeight] = viewBox;

//       // Determine the scale based on the target width
//       const logoTargetWidth = svgWidth / 5;
//       const scale = logoTargetWidth / vbWidth;

//       // Calculate the position for the logo
//       const logoX = svgWidth - logoTargetWidth - LOGO_PADDING;
//       const logoY = LOGO_PADDING;

//       // Apply the transformations and serialize back to SVG string
//       logoSelection
//         .attr("width", logoTargetWidth)
//         .attr("height", vbHeight * scale)
//         .attr("viewBox", [vbX, vbY, vbWidth, vbHeight].join(' ')); // Ensuring the viewBox is preserved

//       const logoTransformed = logoSelection.node().outerHTML;
//       logoSvgPart = `<g transform="translate(${logoX}, ${logoY})">${logoTransformed}</g>`;

//       // ##### BOTTOM LEFT BANNER #####
//       const bannerResponse = await fetch(`/json_banners/${jsonName}.svg`);
//       const bannerSvgText = await bannerResponse.text();
//       // Create a D3 selection from the SVG text
//       const bannerSelection = d3.create("svg")
//         .html(bannerSvgText)
//         .select("svg");
//       // Extract the viewBox values for banner
//       const bannerViewBox = bannerSelection.attr("viewBox").split(' ').map(Number);
//       const [vbXb, vbYb, vbWidthb, vbHeightb] = bannerViewBox;
//       // Determine the scale for the banner based on the target height
//       const bannerTargetHeight = svgHeight / 10;
//       const bannerScale = bannerTargetHeight / vbHeightb;
//       // Calculate the position for the banner
//       const bannerX = 0;
//       const bannerY = svgHeight - bannerTargetHeight - LOGO_PADDING;
//       // Apply the transformations and serialize back to SVG string for banner
//       bannerSelection
//         .attr("width", vbWidthb * bannerScale)
//         .attr("height", bannerTargetHeight)
//         .attr("viewBox", [vbXb, vbYb, vbWidthb, vbHeightb].join(' ')); // Ensuring the viewBox is preserved
//       const bannerTransformed = bannerSelection.node().outerHTML;
//       bannerSvgPart = `<g transform="translate(${bannerX}, ${bannerY})">${bannerTransformed}</g>`;
//     } catch (error) {
//       console.error(`Error fetching images: ${error}`);
//       throw error; // Rethrow error to be handled by the caller
//     }
//   }

//   // Combine logo and banner parts into one SVG group
//   return `${logoSvgPart}${bannerSvgPart}`;
// };
