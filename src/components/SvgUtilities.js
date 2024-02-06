import opentype from 'opentype.js';
import { FONT_SIZE, MAX_CHAR_SIZE, MAX_DIMENSION } from './MosaicGenerator';

export const wrapSvgContent = (svgContent, dimensions, additionalAttributes = {}) => {
  const attributeString = Object.entries(additionalAttributes)
    .map(([key, value]) => `${key}="${value}"`)
    .join(' ');
  const width = dimensions.width || MAX_CHAR_SIZE * MAX_DIMENSION;
  const height = dimensions.height || MAX_CHAR_SIZE * MAX_DIMENSION;
  
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" ${attributeString}>${svgContent}</svg>`;
};

export const unwrapSvgContent = (svgString) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgString, 'image/svg+xml');
  const svgElement = doc.querySelector('svg');

  if (!svgElement) return { innerHTML: '', dimensions: { width: 0, height: 0 } };

  const width = svgElement.getAttribute('width') || svgElement.viewBox.baseVal.width;
  const height = svgElement.getAttribute('height') || svgElement.viewBox.baseVal.height;
  const innerHTML = svgElement.innerHTML;

  return { innerHTML, dimensions: { width, height } };
};

// Utility to load a font and convert text elements in SVG to paths
export const convertTextToPaths = async (svgContent, dimensions) => {
  return new Promise((resolve, reject) => {
    opentype.load('fonts/power.ttf', (err, font) => {
      if (err) {
        reject('Font could not be loaded: ' + err);
      } else {
        const fullSvgContent = wrapSvgContent(svgContent, dimensions);
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(fullSvgContent, "application/xml");
        const textElements = xmlDoc.getElementsByTagName('text');

        Array.from(textElements).forEach((textElement) => {
          const text = textElement.textContent;
          const textX = parseFloat(textElement.getAttribute('x')) || 0;
          const textY = parseFloat(textElement.getAttribute('y')) || 0;
          const path = font.getPath(text, textX, textY, FONT_SIZE);
          const pathData = path.toPathData();

          const newPathElement = xmlDoc.createElementNS('http://www.w3.org/2000/svg', 'path');
          newPathElement.setAttribute('d', pathData);
          newPathElement.setAttribute('fill', textElement.getAttribute('fill'));
          textElement.parentNode.replaceChild(newPathElement, textElement);
        });

        const serializer = new XMLSerializer();
        const svgContentWithPaths = serializer.serializeToString(xmlDoc.documentElement);
        resolve(svgContentWithPaths);
      }
    });
  });
};

// Function to trigger the download of the file
export const downloadFile = (svgContent, fileName) => {
  const svgBlob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
  const svgUrl = URL.createObjectURL(svgBlob);

  const downloadLink = document.createElement('a');
  downloadLink.href = svgUrl;
  downloadLink.download = `famous_jsons_${fileName}.svg`;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);

  URL.revokeObjectURL(svgUrl);
};

// Updated download function to use the new utilities
export const download = async (svgContent, dimensions, uploadName) => {
  try {
    const svgContentWithPaths = await convertTextToPaths(svgContent, dimensions);
    let fileName = uploadName ? uploadName.split('.').slice(0, -1).join('.') : "generation";
    if (!fileName) fileName = "generation";
    downloadFile(svgContentWithPaths, fileName);
  } catch (error) {
    console.error('Error in download:', error);
  }
};
