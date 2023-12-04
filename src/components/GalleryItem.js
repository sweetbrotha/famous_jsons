import React from 'react';

function GalleryItem({ jsonName }) {
  const svgUrl = `/json_art/${jsonName}.svg`;

  return (
    <div className="w-96 h-96 cursor-pointer hover:ring-2 hover:ring-cybergreen">
      <img src={svgUrl} alt={jsonName} className="w-full h-full" />
    </div>
  );
}

export default GalleryItem;
