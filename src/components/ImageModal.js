import React, { useRef, useEffect, useState, useCallback } from 'react';
import IconButton from './IconButton.js';
import { download } from './SvgUtilities';
import svgPanZoom from 'svg-pan-zoom';
import { debounce } from 'lodash';

export function ImageModal({ isOpen, svgContent, dimensions, uploadName, jsonName, onClose }) {

  const MIN_ZOOM = 1;

  const svgContainerRef = useRef(null);
  const panZoomInstanceRef = useRef(null);
  const startDistanceRef = useRef(null);
  const originalZoomRef = useRef(null);
  const [svgFrameDimensions, setSvgFrameDimensions] = useState({});
  const [renderTrigger, setRenderTrigger] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('no-scroll');
    } else {
      document.body.classList.remove('no-scroll');
    }
    return () => {
      document.body.classList.remove('no-scroll'); // remove class on unmount
    };
  }, [isOpen]);

  const triggerRerender = useCallback(() => {
    setRenderTrigger(prev => !prev); // trigger re-render, re-instantiate svg-pan-zoom
  }, []);

  const debouncedRerender = debounce(triggerRerender, 500);

  useEffect(() => {
    window.addEventListener('resize', debouncedRerender);
    return () => {
      window.removeEventListener('resize', debouncedRerender);
      debouncedRerender.cancel(); // Cancel any debounced calls on unmount
    };
  }, [debouncedRerender]);

  const getDistanceBetweenTouches = (touches) => {
    const dx = touches[0].pageX - touches[1].pageX;
    const dy = touches[0].pageY - touches[1].pageY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = useCallback((event) => {
    if (event.touches.length === 2) { // Only handle two-finger touch
      event.preventDefault(); // Prevent default behavior to capture pinch-zoom gesture
      const startDistance = getDistanceBetweenTouches(event.touches);
      startDistanceRef.current = startDistance;
      originalZoomRef.current = panZoomInstanceRef.current.getZoom();
    }
  }, []);

  const handleTouchMove = useCallback((event) => {
    if (event.touches.length === 2) {
      event.preventDefault();
      const startDistance = startDistanceRef.current;
      const originalZoom = originalZoomRef.current;
      const currentDistance = getDistanceBetweenTouches(event.touches);
      const zoomFactor = currentDistance / startDistance;
      const newZoom = Math.max(MIN_ZOOM, originalZoom * zoomFactor);
      if (newZoom === originalZoom) {
        return; // zoomed maximally/minimally, do nothing
      }
      panZoomInstanceRef.current.zoom(newZoom);
    }
  }, []);

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
      // Destroy the current panZoomInstance if it exists (not sure if necessary)
      if (panZoomInstanceRef.current) {
        panZoomInstanceRef.current.destroy();
        panZoomInstanceRef.current = null;
      }
      // Initialize svg-pan-zoom
      panZoomInstanceRef.current = svgPanZoom(svgContainerRef.current, {
        beforePan: beforePan,
        dblClickZoomEnabled: false,
        minZoom: MIN_ZOOM,
      });
    }
    return () => {
      // Cleanup svg-pan-zoom instance on component unmount
      if (panZoomInstanceRef.current) {
        panZoomInstanceRef.current.destroy();
        panZoomInstanceRef.current = null;
      }
    };
  }, [isOpen, renderTrigger, dimensions, svgContent]);

  useEffect(() => {
    const svgElement = svgContainerRef.current;
    if (svgElement) {
      // set up touch listeners
      svgElement.addEventListener('touchstart', handleTouchStart, { passive: false });
      svgElement.addEventListener('touchmove', handleTouchMove, { passive: false });
    }

    return () => {
      if (svgElement) {
        // tear down touch listeners
        svgElement.removeEventListener('touchstart', handleTouchStart);
        svgElement.removeEventListener('touchmove', handleTouchMove);
      }
    };
  }, [isOpen, renderTrigger, handleTouchStart, handleTouchMove]);

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
    setShowHelp(false);
    let timeoutId;
    if (isOpen) {
      // we sometimes need a re-render once everything is calculated
      timeoutId = setTimeout(() => {
        triggerRerender();
      }, 200);
    }
    return () => {
      clearTimeout(timeoutId);
    };
  }, [isOpen, triggerRerender]);

  // Don't render anything if this isn't open
  if (!isOpen) return null;

  return (
    <div className="fixed top-0 left-0 w-full h-full bg-darkgray opacity-[.99] flex flex-col items-center justify-center z-50 overflow-hidden">
      <button
        onClick={onClose}
        className="absolute top-4 md:top-8 right-5 md:right-8 text-white text-xl font-bold font-courier hover:text-cybergold"
      >
        ×
      </button>
      <div
        id="log"
        className="absolute top-4 md:top-8 left-5 md:left-8 text-white text-xs font-courier"
      />

      {/* Container for the SVG and its related elements */}
      <div className="w-full flex flex-col items-center justify-center relative" style={svgFrameDimensions}>
        {/* Filename Label */}
        {jsonName && (
          <div className="absolute top-[-1.1rem] md:top-[-1.25rem] left-0 font-courier text-cybergold text-xs md:text-sm">
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
          className="ring-1 ring-cybergold cursor-default"
        />
        {/* Help Text */}
        <div className={`absolute top-[-2.5rem] font-courier text-lightgray text-xxxs md:text-xs text-center transition-opacity duration-1000 ease-in-out ${showHelp ? 'opacity-100' : 'opacity-0'}`}>
          <p>{'{'} pinch or scroll to zoom {'}'}</p>
          <p>{'{'} click and drag to to pan {'}'}</p>
        </div>
      </div>

      {/* Icon Buttons */}
      <div className="flex space-x-6 pt-4">
        <IconButton name="reset" onClick={onReset} />
        {!jsonName && <IconButton name="save" onClick={onSave} />}
        <IconButton name="help" onClick={onHelp} isPressed={showHelp} />
        <IconButton name="close" onClick={onClose} />
      </div>
    </div>
  );
}

export default ImageModal;
