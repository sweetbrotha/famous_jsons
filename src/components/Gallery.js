import React, { useState, useEffect } from 'react';
import GalleryItem from './GalleryItem';
import ImageModal from './ImageModal';
import JsonModal from './JsonModal';
import { unwrapSvgContent } from './SvgUtilities';
import { MAX_IMAGE_SIZE } from './MosaicGenerator';


function Gallery() {
  const [jsonFiles, setJsonFiles] = useState([]);
  const [filteredJsonFiles, setFilteredJsonFiles] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);
  const [imageModalContent, setImageModalContent] = useState('');
  const [selectedJsonName, setSelectedJsonName] = useState('');
  const [selectedJsonContent, setSelectedJsonContent] = useState('');

  useEffect(() => {
    fetch('/jsons.txt')
      .then(response => response.text())
      .then(text => {
        const jsonNames = text.split('\n');
        return Promise.all(jsonNames.map(jsonName =>
          fetch(`/json_json/${jsonName}.json`)
            .then(response => response.text())
            .then(jsonContent => ({ jsonName, jsonContent }))
        ));
      })
      .then(jsonFiles => {
        setJsonFiles(jsonFiles);
        setFilteredJsonFiles(jsonFiles); // Initially display all files
      })
      .catch(error => console.error('Error fetching JSONs:', error));
  }, []);

  useEffect(() => {
    const lowercasedSearchTerm = searchTerm.toLowerCase();
    const matchedFiles = jsonFiles.filter(({ jsonName, jsonContent }) =>
      jsonName.toLowerCase().includes(lowercasedSearchTerm) ||
      jsonContent.toLowerCase().includes(lowercasedSearchTerm)
    );
    setFilteredJsonFiles(matchedFiles);
  }, [searchTerm, jsonFiles]);


  const openImageModal = (jsonName) => {
    setIsJsonModalOpen(false); // never have both modals open
    setSelectedJsonName(jsonName);
    fetch(`/json_art/${jsonName}.svg`)
      .then(response => response.text())
      .then(svgString => {
        const { innerHTML } = unwrapSvgContent(svgString);
        setImageModalContent(innerHTML);
        setIsImageModalOpen(true);
      })
      .catch(error => console.error('Error fetching SVG:', error));
  };

  const openJsonModal = (jsonName, jsonContent) => {
    setIsImageModalOpen(false) // never have both modals open;
    setSelectedJsonName(jsonName);
    setSelectedJsonContent(jsonContent);
    setIsJsonModalOpen(true);
  };

  return (
    <div className="flex flex-col w-full items-center">
      <div className="flex flex-col items-center mt-2">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search JSONs"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="focus:outline-none focus:ring-2 focus:ring-cybergold rounded bg-lightgray font-courier text-darkgray p-1 pl-2 w-64"
          />
        </div>
        {searchTerm && (
          <span className="font-courier text-cybergreen text-sm mt-2">
          {`{ ${filteredJsonFiles.length} matching JSON${filteredJsonFiles.length === 1 ? '' : 's'} }`}
        </span>
        )}
      </div>

      <div className="flex flex-wrap justify-center mx-auto py-24 gap-24 w-4/5">
        {filteredJsonFiles.map(({ jsonName, jsonContent }, index) => (
          <GalleryItem
            key={index}
            jsonName={jsonName}
            jsonContent={jsonContent}
            itemId={index}
            onArtClick={() => openImageModal(jsonName)}
            onJsonClick={() => openJsonModal(jsonName, jsonContent)}
          />
        ))}
        <ImageModal
          isOpen={isImageModalOpen}
          svgContent={imageModalContent}
          dimensions={{ width: MAX_IMAGE_SIZE, height: MAX_IMAGE_SIZE }}
          jsonName={selectedJsonName}
          onClose={() => setIsImageModalOpen(false)}
        />
        <JsonModal
          isOpen={isJsonModalOpen}
          jsonName={selectedJsonName}
          jsonContent={selectedJsonContent}
          onClose={() => setIsJsonModalOpen(false)}
        />
      </div>
    </div>
  );
}

export default Gallery;
