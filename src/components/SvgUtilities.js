import opentype from 'opentype.js';
import { FONT_SIZE, MAX_CHAR_SIZE, MAX_DIMENSION } from './MosaicGenerator';

export const wrapSvgContent = (svgContent, dimensions) => {
  const width = dimensions.width || MAX_CHAR_SIZE * MAX_DIMENSION;
  const height = dimensions.height || MAX_CHAR_SIZE * MAX_DIMENSION;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">${svgContent}</svg>`;
};

export const download = (svgContent, dimensions, uploadName) => {
  // Load the font
  opentype.load('fonts/power.ttf', (err, font) => {
    if (err) {
      console.error('Font could not be loaded: ', err);
    } else {
      // Wrap the SVG content in <svg>
      const fullSvgContent = wrapSvgContent(svgContent, dimensions);
      // Parse the full SVG content
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(fullSvgContent, "application/xml");
      const textElements = xmlDoc.getElementsByTagName('text');

      // Convert each text element to a path
      Array.from(textElements).forEach((textElement) => {
        const text = textElement.textContent;
        const textX = parseFloat(textElement.getAttribute('x')) || 0;
        const textY = parseFloat(textElement.getAttribute('y')) || 0;
        const pathX = textX;
        const pathY = textY; // might benefit from slight adjustment for alignment-baseline=middle
        const fill = textElement.getAttribute('fill');
        const path = font.getPath(text, pathX, pathY, FONT_SIZE);
        const pathData = path.toPathData();

        // Replace text element with a path element
        const newPathElement = xmlDoc.createElementNS('http://www.w3.org/2000/svg', 'path');
        newPathElement.setAttribute('d', pathData);
        newPathElement.setAttribute('fill', fill);
        textElement.parentNode.replaceChild(newPathElement, textElement);
      });

      // Serialize the xmlDoc back to a string
      const serializer = new XMLSerializer();
      const svgContentWithPaths = serializer.serializeToString(xmlDoc.documentElement);

      // Continue with creating the Blob and downloading the file as before
      const svgBlob = new Blob([svgContentWithPaths], { type: 'image/svg+xml;charset=utf-8' });
      const svgUrl = URL.createObjectURL(svgBlob);

      const downloadLink = document.createElement('a');
      downloadLink.href = svgUrl;
      let fileName = uploadName.split('.').slice(0, -1).join('.');
      if (!fileName) fileName = "generation"; // fall back to something simple if this doesn't work
      downloadLink.download = `famous_jsons_${fileName}.svg`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      // Clean up the URL object
      URL.revokeObjectURL(svgUrl);
    }
  });
};