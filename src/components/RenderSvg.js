import React from 'react';
import parse from 'html-react-parser';
import { wrapSvgContent } from './SvgUtilities'; // Import your utility function

const RenderSvg = ({ svgContent, dimensions }) => {
  const wrappedSvg = wrapSvgContent(svgContent, dimensions);
  return <>{parse(wrappedSvg)}</>;
};

export default RenderSvg;