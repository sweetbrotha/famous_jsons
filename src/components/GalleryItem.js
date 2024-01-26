import React from 'react';
import IconButton from './IconButton';
import { CONTRACT_ADDRESS, BASE_OPENSEA_URL } from './constants';
import { useProjectState } from './ProjectStateProvider';

function GalleryItem({ jsonName, jsonContent, itemId, onArtClick, onJsonClick, isMinted, onMintClick }) {
  
  const { isFetched } = useProjectState();
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

  const handleMintClick = () => {
    if (onMintClick) {
      onMintClick(itemId);
    }
  };

  const handleMarketClick = () => {
    const openseaLink = `${BASE_OPENSEA_URL}/${CONTRACT_ADDRESS}/${itemId}`;
    window.open(openseaLink, '_blank');
};


  return (
    <div className="w-96 h-96 cursor-pointer hover:ring-2 hover:ring-cybergreen">
      <img onClick={onArtClick} src={svgUrl} alt={jsonName} className="w-full h-full" />
      <div className="flex justify-center space-x-6 pt-4">
        <IconButton name="art" onClick={handleArtClick} />
        <IconButton name="json" onClick={handleJsonClick} />
        {isMinted ? (
          <IconButton name="market" onClick={handleMarketClick} />
        ) : (
          <IconButton name="mint" onClick={handleMintClick} disabled={!isFetched} />
        )}
      </div>
    </div>
  );
}

export default GalleryItem;
