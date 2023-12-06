import React from 'react';
import IconButton from './IconButton';

function GalleryItem({ jsonName, jsonContent, itemId, onArtClick, onJsonClick }) {
  const svgUrl = `/json_art/${jsonName}.svg`;

    const handleArtClick = () => {
      if (onArtClick) {
        onArtClick(jsonName);
      }
    };

    const handleJsonClick = () => {
      if (onJsonClick) {
        onJsonClick(jsonName, jsonContent);
      }
    };
  
    const handleMarketClick = () => {
      console.log("Market button clicked for item with ID:", itemId);
      window.open('https://opensea.io/', '_blank');
    };

  return (
    <div className="w-96 h-96 cursor-pointer hover:ring-2 hover:ring-cybergreen">
      <img onClick={onArtClick} src={svgUrl} alt={jsonName} className="w-full h-full" />
      <div className="flex justify-center space-x-6 pt-4">
        <IconButton name="art" onClick={handleArtClick} />
        <IconButton name="json" onClick={handleJsonClick} />
        <IconButton name="market" onClick={handleMarketClick} />
      </div>
    </div>
  );
}

export default GalleryItem;
