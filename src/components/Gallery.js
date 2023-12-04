import React, { useState, useEffect } from 'react';
import GalleryItem from './GalleryItem'; // Import the GalleryItem component

function Gallery() {
  const [jsonNames, setJsonNames] = useState([]);

  useEffect(() => {
    fetch('/jsons.txt')
      .then(response => response.text())
      .then(text => {
        const valueList = text.split('\n');
        setJsonNames(valueList);
      })
      .catch(error => console.error('Error fetching jsons.txt:', error));
  }, []);

  return (
    <div className="flex flex-wrap justify-center mx-auto py-16 gap-24 w-4/5">
      {jsonNames.map((value, index) => (
        <GalleryItem key={index} jsonName={value} />
      ))}
    </div>
  );
}

export default Gallery;
