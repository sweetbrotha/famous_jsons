import React from 'react';
import IconButton from './IconButton';
import { CONTRACT_ADDRESS, BASE_OPENSEA_URL } from './constants';
import { useProjectState } from './ProjectStateProvider';

function GalleryItem({ jsonName, jsonContent, itemId, onArtClick, onJsonClick, isMinted, onMintClick }) {
  
  const { isFetched } = useProjectState();
  const pngUrl = `/json_art_small/${jsonName}.png`;

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
    <div className="w-48 h-48 md:w-72 md:h-72 cursor-pointer md:hover:ring-2 md:hover:ring-cybergreen">
      <img onClick={onArtClick} src={pngUrl} alt={jsonName} className="w-full h-full" />
      <div className="flex justify-center space-x-6 pt-3 md:pt-4">
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
