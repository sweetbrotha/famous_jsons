import * as d3 from 'd3';

export const MAX_DIMENSION = 150;
export const CHAR_SIZE = 14;
export const FONT_SIZE_INCREASE = 2;
export const FONT_SIZE = CHAR_SIZE + FONT_SIZE_INCREASE;
export const TILE_HEIGHT = 50;
export const LOGO_PADDING = CHAR_SIZE * 5;

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

// Exposed method handling FJ flag
export const drawMosaic = async (uploadedImage, inputText, fj, callback) => {
  let jsonName = null;

  if (fj) {
    jsonName = inputText;
    try {
      // Attempt to load the JSON text
      const textResponse = await fetch(`/json_json/${jsonName}.json`);
      if (!textResponse.ok) throw new Error(`Text file not found: ${jsonName}.json`);
      inputText = await textResponse.text();

      // Attempt to load the image, trying both .jpeg and .jpg extensions
      let imageResponse = await fetch(`/json_images/${jsonName}.jpg`);
      if (!imageResponse.ok) {
        throw new Error(`Image file not found: ${jsonName}.jpg`);
      }

      const imageBlob = await imageResponse.blob();
      // Resize the image before proceeding
      resizeImage(imageBlob, async (resizedImageBlob) => {
        const resizedImage = new File([resizedImageBlob], "resized_image.jpeg", { type: "image/jpeg" });
        const image = new Image();
        image.src = URL.createObjectURL(resizedImage);
        await new Promise((resolve, reject) => {
          image.onload = () => resolve();
          image.onerror = () => reject(new Error('Image could not be loaded'));
        });
        await privateDrawMosaic(image, inputText, jsonName, callback);
      });

    } catch (error) {
      console.error(error);
      alert(`An error occurred: ${error.message}`);
    }
  } else {
    const image = new Image();
    image.src = URL.createObjectURL(uploadedImage);
    await new Promise((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('Image could not be loaded'));
    });
    await privateDrawMosaic(image, inputText, jsonName, callback);
  }
};

// common mosaic drawing logic
const privateDrawMosaic = async (image, inputText, jsonName, callback) => {
  const numberOfTiles = Math.ceil(image.height / TILE_HEIGHT);
  const originalCanvas = document.createElement('canvas');
  originalCanvas.width = image.width;
  originalCanvas.height = image.height;
  const svgWidth = image.width * CHAR_SIZE;
  const svgHeight = image.height * CHAR_SIZE;
  const originalCtx = originalCanvas.getContext('2d', { willReadFrequently: true });
  originalCtx.drawImage(image, 0, 0);

  // Clean input by replacing all instances of consecutive whitespace with a single space
  inputText = inputText.replace(/\s+/g, ' ');

  let textIndex = 0;
  let svgContent = ""; // This will store the SVG content

  for (let t = 0; t < numberOfTiles; t++) {
    const startY = t * TILE_HEIGHT;
    const tileHeight = Math.min(TILE_HEIGHT, image.height - startY);
    const { newTextIndex, tileSvg } = processTile(originalCtx, image, startY, tileHeight, inputText, textIndex);
    textIndex = newTextIndex;
    svgContent += tileSvg; // append SVG content of the current tile
  }

  const logoSvg = await getLogoXml(svgWidth, svgHeight, jsonName);
  svgContent += logoSvg;
  callback(svgContent, { width: svgWidth, height: svgHeight });
};

const getLogoXml = async (svgWidth, svgHeight, jsonName) => {
  let logoSvgPart = '';
  let bannerSvgPart = '';
  if (jsonName) { // no json, no overlays
    try {
      // ##### TOP RIGHT LOGO #####
      const logoResponse = await fetch('/logo_art.svg');
      const logoSvgText = await logoResponse.text();
      // Create a D3 selection from the SVG text
      const logoSelection = d3.create("svg")
        .html(logoSvgText)
        .select("svg");

      // Extract the viewBox values
      const viewBox = logoSelection.attr("viewBox").split(' ').map(Number);
      const [vbX, vbY, vbWidth, vbHeight] = viewBox;

      // Determine the scale based on the target width
      const logoTargetWidth = svgWidth / 5;
      const scale = logoTargetWidth / vbWidth;

      // Calculate the position for the logo
      const logoX = svgWidth - logoTargetWidth - LOGO_PADDING;
      const logoY = LOGO_PADDING;

      // Apply the transformations and serialize back to SVG string
      logoSelection
        .attr("width", logoTargetWidth)
        .attr("height", vbHeight * scale)
        .attr("viewBox", [vbX, vbY, vbWidth, vbHeight].join(' ')); // Ensuring the viewBox is preserved

      const logoTransformed = logoSelection.node().outerHTML;
      logoSvgPart = `<g transform="translate(${logoX}, ${logoY})">${logoTransformed}</g>`;

      // ##### BOTTOM LEFT BANNER #####
      const bannerResponse = await fetch(`/json_banners/${jsonName}.svg`);
      const bannerSvgText = await bannerResponse.text();
      // Create a D3 selection from the SVG text
      const bannerSelection = d3.create("svg")
        .html(bannerSvgText)
        .select("svg");
      // Extract the viewBox values for banner
      const bannerViewBox = bannerSelection.attr("viewBox").split(' ').map(Number);
      const [vbXb, vbYb, vbWidthb, vbHeightb] = bannerViewBox;
      // Determine the scale for the banner based on the target height
      const bannerTargetHeight = svgHeight / 10;
      const bannerScale = bannerTargetHeight / vbHeightb;
      // Calculate the position for the banner
      const bannerX = 0;
      const bannerY = svgHeight - bannerTargetHeight - LOGO_PADDING;
      // Apply the transformations and serialize back to SVG string for banner
      bannerSelection
        .attr("width", vbWidthb * bannerScale)
        .attr("height", bannerTargetHeight)
        .attr("viewBox", [vbXb, vbYb, vbWidthb, vbHeightb].join(' ')); // Ensuring the viewBox is preserved
      const bannerTransformed = bannerSelection.node().outerHTML;
      bannerSvgPart = `<g transform="translate(${bannerX}, ${bannerY})">${bannerTransformed}</g>`;
    } catch (error) {
      console.error(`Error fetching images: ${error}`);
      throw error; // Rethrow error to be handled by the caller
    }
  }

  // Combine logo and banner parts into one SVG group
  return `${logoSvgPart}${bannerSvgPart}`;
};


const processTile = (originalCtx, image, startY, tileHeight, inputText, textIndex) => {
  let tileSvg = `<g font-family="Power" font-size="${FONT_SIZE}px" text-anchor="middle" alignment-baseline="middle">`;

  for (let y = startY; y < startY + tileHeight; y++) {
    const rowData = originalCtx.getImageData(0, y, image.width, 1).data;
    for (let x = 0; x < image.width; x++) {
      if (textIndex >= inputText.length) textIndex = 0; // loop around the text

      const char = inputText.charAt(textIndex);
      textIndex++;

      const pixelIndex = x * 4;
      const pixelColor = `rgba(${rowData[pixelIndex]},${rowData[pixelIndex + 1]},${rowData[pixelIndex + 2]},${rowData[pixelIndex + 3] / 255})`;

      if (!/\s/.test(char)) {
        // Render text for non-whitespace only
        tileSvg += `<text x="${(x * CHAR_SIZE) + (CHAR_SIZE / 2)}" y="${(y * CHAR_SIZE) + CHAR_SIZE}" fill="${pixelColor}">${char}</text>`;
      }

    }
  }
  tileSvg += "</g>";

  return { newTextIndex: textIndex, tileSvg };
};
