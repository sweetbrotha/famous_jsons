import React, { useRef, useEffect, useState, useCallback } from 'react';
import IconButton from './IconButton.js';
import { download } from './SvgUtilities';
import svgPanZoom from 'svg-pan-zoom';
import { debounce } from 'lodash';

export function ImageModal({ isOpen, svgContent, dimensions, uploadName, jsonName, onClose }) {
  const svgContainerRef = useRef(null);
  const panZoomInstanceRef = useRef(null);
  const minZoomRef = useRef(1); // This gets updated
  const [svgFrameDimensions, setSvgFrameDimensions] = useState({});
  const [renderTrigger, setRenderTrigger] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const triggerRerender = useCallback(() => {
    // Trigger a re-render which re-instantiates svg-pan-zoom
    setRenderTrigger(prev => !prev);
  }, []);

  const debouncedRerender = debounce(triggerRerender, 500);

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

    // Don't allow panning beyond SVG's boundaries
    const customPan = {};
    customPan.x = Math.min(newPan.x, rightLimit);
    customPan.x = Math.max(customPan.x, leftLimit);
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

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('no-scroll');
    } else {
      document.body.classList.remove('no-scroll');
    }
    // Cleanup function to ensure we remove the class when the component unmounts
    return () => {
      document.body.classList.remove('no-scroll');
    };
  }, [isOpen]);


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
    onClose();
  };

  const onReset = () => {
    triggerRerender();
  };

  const onSave = () => {
    download(svgContent, dimensions, uploadName);
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
    <div className="fixed top-0 left-0 w-full h-full bg-black opacity-95 flex flex-col items-center justify-center z-50 overflow-hidden">
      <button
        onClick={handleOnClose}
        className="absolute top-8 right-8 text-white text-xl font-bold font-courier hover:text-cybergold"
      >
        ×
      </button>

      {/* Container for the SVG and its related elements */}
      <div className="w-full flex flex-col items-center justify-center relative" style={svgFrameDimensions}>
        {/* Filename Label */}
        {jsonName && (
          <div className="absolute top-[-1.25rem] left-0 font-courier text-cybergold text-sm">
            {`${jsonName}.svg`}
          </div>
        )}
        {/* SVG Container */}
        <svg
          ref={svgContainerRef}
          viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
          width="100%"
          height="100%"
          dangerouslySetInnerHTML={{ __html: svgContent }}
          xmlns="http://www.w3.org/2000/svg"
          className="ring-1 ring-cybergold"
        />
        {/* Help Text */}
        <div className={`absolute top-[-2.5rem] font-courier text-lightgray text-xs text-center transition-opacity duration-1000 ease-in-out ${showHelp ? 'opacity-100' : 'opacity-0'}`}>
          <p>{'{'} pinch, scroll, or double-click to zoom {'}'}</p>
          <p>{'{'} click and drag to to pan {'}'}</p>
        </div>
      </div>

      {/* Icon Buttons */}
      <div className="flex space-x-6 pt-4">
        <IconButton name="reset" onClick={onReset} />
        <IconButton name="save" onClick={onSave} />
        <IconButton name="help" onClick={onHelp} isPressed={showHelp} />
        <IconButton name="close" onClick={handleOnClose} />
      </div>
    </div>
  );

}

export default ImageModal;
