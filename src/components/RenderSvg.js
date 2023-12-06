import React from 'react';
import parse from 'html-react-parser';
import { wrapSvgContent } from './SvgUtilities';

const RenderSvg = ({ svgContent, dimensions, ...additionalAttributes }) => {
  const wrappedSvg = wrapSvgContent(svgContent, dimensions, additionalAttributes);
  return <>{parse(wrappedSvg)}</>;
};

export default RenderSvg;
