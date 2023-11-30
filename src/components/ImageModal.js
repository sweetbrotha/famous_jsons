import React, { useRef, useEffect, useState, useCallback } from 'react';
import IconButton from './IconButton.js';
import { download } from './SvgUtilities';
import svgPanZoom from 'svg-pan-zoom';
import { debounce } from 'lodash';

export function ImageModal({ isOpen, svgContent, dimensions, onClose }) {
  const svgContainerRef = useRef(null);
  const panZoomInstanceRef = useRef(null);
  const minZoomRef = useRef(1); // This gets updated
  const [svgFrameDimensions, setSvgFrameDimensions] = useState({});
  const [renderTrigger, setRenderTrigger] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const triggerRerender = useCallback(() => {
    // Trigger a re-render which will re-instantiate svg-pan-zoom
    setRenderTrigger(prev => !prev);
  }, []);

  const debouncedRerender = debounce(triggerRerender, 250);

  useEffect(() => {
    window.addEventListener('resize', debouncedRerender);
    return () => {
      window.removeEventListener('resize', debouncedRerender);
      debouncedRerender.cancel(); // Cancel any debounced calls on unmount
    };
  }, [debouncedRerender]);

  const beforeZoom = (_, newZoom) => {
    // Prevent zooming out beyond the initial zoom level
    return newZoom >= minZoomRef.current;
  };

  const beforePan = (_, newPan) => {
    // Calculate the boundaries
    const sizes = panZoomInstanceRef.current.getSizes();
    const leftLimit = -((sizes.viewBox.x + sizes.viewBox.width) * sizes.realZoom) + sizes.width;
    const rightLimit = 0;
    const topLimit = -((sizes.viewBox.y + sizes.viewBox.height) * sizes.realZoom) + sizes.height;
    const bottomLimit = 0;

    // Don't allow panning to the left of the SVG's left boundary
    const customPan = {};
    customPan.x = Math.min(newPan.x, rightLimit);
    customPan.x = Math.max(customPan.x, leftLimit);

    // Don't allow panning above the SVG's top boundary
    customPan.y = Math.min(newPan.y, bottomLimit);
    customPan.y = Math.max(customPan.y, topLimit);

    return customPan;
  };

  useEffect(() => {
    if (dimensions.width && dimensions.height) {
      const imageRatio = dimensions.width / dimensions.height;
      const viewportWidth = window.innerWidth * 0.75; // 3/4 of viewport width
      const viewportHeight = window.innerHeight * 0.75; // 3/4 of viewport height
      const viewportRatio = viewportWidth / viewportHeight;

      if (imageRatio > viewportRatio) {
        // Image is wider than viewport
        setSvgFrameDimensions({
          width: '75%', // 3/4 of viewport width
          height: `calc(${viewportWidth / imageRatio}px)`, // calculate height based on image ratio
        });
      } else {
        // Image is taller than viewport or has the same aspect ratio
        setSvgFrameDimensions({
          height: '75%', // 3/4 of viewport height
          width: `calc(${viewportHeight * imageRatio}px)`, // calculate width based on image ratio
        });
      }
    }
    if (svgContainerRef.current) {
      // Destroy the current panZoomInstance if it exists
      if (panZoomInstanceRef.current) {
        panZoomInstanceRef.current.destroy();
        panZoomInstanceRef.current = null;
      }
      // Initialize svg-pan-zoom
      panZoomInstanceRef.current = svgPanZoom(svgContainerRef.current, {
        zoomEnabled: true,
        controlIconsEnabled: false,
        fit: true,
        center: true,
        beforePan: beforePan,
        beforeZoom: beforeZoom,
      });
      // Set the minimum zoom level after the initial fit
      setTimeout(() => {
        minZoomRef.current = panZoomInstanceRef.current.getZoom();
      }, 100);
    }
    return () => {
      // Cleanup svg-pan-zoom instance when component unmounts or dimensions change
      if (panZoomInstanceRef.current) {
        panZoomInstanceRef.current.destroy();
        panZoomInstanceRef.current = null;
      }
    };
  }, [isOpen, renderTrigger, dimensions, svgContent]);

  const resetModal = () => {
    // Reset pan/zoom
    if (panZoomInstanceRef.current) {
      panZoomInstanceRef.current.resetZoom();
      panZoomInstanceRef.current.resetPan();
      panZoomInstanceRef.current.fit();
      panZoomInstanceRef.current.center();
      minZoomRef.current = panZoomInstanceRef.current.getZoom();
    }
    // Reset help text and button state
    setShowHelp(false);
  };

  const handleOnClose = () => {
    resetModal();
    onClose(); // Call the onClose prop
  };

  const onReset = () => {
    triggerRerender();
  };

  const onSave = () => {
    download(svgContent, dimensions);
  };

  const onHelp = () => {
    setShowHelp(prevShowHelp => !prevShowHelp);
  };

  useEffect(() => {
    if (!isOpen) {
      resetModal(); // reset on close
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed top-0 left-0 w-full h-full bg-darkgray flex flex-col items-center justify-center z-50 overflow-hidden">
      <div className="w-full flex justify-center items-start pb-4">
        <div className={`w-4/5 flex flex-col justify-center items-center transition-opacity duration-1000 ease-in-out ${showHelp ? 'opacity-100' : 'opacity-0'}`}>
          <p className="text-lightgray text-xs text-center">
            {'{'} pinch, scroll, or double-click to zoom {'}'}
          </p>
          <p className="text-lightgray text-xs text-center">
            {'{'} click and drag to to pan {'}'}
          </p>
        </div>
      </div>
      <div className="relative cursor-default" style={svgFrameDimensions}>
        <svg
          ref={svgContainerRef}
          viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
          width="100%"
          height="100%"
          dangerouslySetInnerHTML={{ __html: svgContent }}
          xmlns="http://www.w3.org/2000/svg"
        />
      </div>
      <div className="flex space-x-6 pt-2">
        <IconButton name="reset" onClick={onReset} />
        <IconButton name="save" onClick={onSave} />
        <IconButton name="help" onClick={onHelp} isPressed={showHelp} />
        <IconButton name="close" onClick={handleOnClose} />
      </div>
    </div>
  );
  
}

export default ImageModal;
