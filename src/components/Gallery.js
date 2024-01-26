import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useProjectState } from './ProjectStateProvider';
import GalleryItem from './GalleryItem';
import ImageModal from './ImageModal';
import JsonModal from './JsonModal';
import MintModal from './MintModal';
import { JSON_COUNT } from './constants';
import { unwrapSvgContent } from './SvgUtilities';
import { MAX_IMAGE_SIZE } from './MosaicGenerator';

function Gallery() {
  const [jsonFiles, setJsonFiles] = useState([]);
  const [jsonIndexMap, setJsonIndexMap] = useState({});
  const [filteredJsonFiles, setFilteredJsonFiles] = useState([]);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);
  const [isMintModalOpen, setIsMintModalOpen] = useState(false);
  const [imageModalContent, setImageModalContent] = useState('');
  const [selectedJsonName, setSelectedJsonName] = useState('');
  const [selectedJsonContent, setSelectedJsonContent] = useState('');
  const [showUnmintedOnly, setShowUnmintedOnly] = useState(false);
  const { projectState, isFetched } = useProjectState();

  const [searchParams] = useSearchParams();
  const initialSearchTerm = searchParams.get('s') || '';
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);

  // Function to fetch JSON files
  function fetchJsons() {
    fetch('/jsons.txt')
      .then(response => response.text())
      .then(text => {
        const jsonNames = text.split('\n');
        const newJsonIndexMap = {};
        return Promise.all(jsonNames.map((jsonName, index) => {
          newJsonIndexMap[jsonName] = index;
          return fetch(`/json_json/${jsonName}.json`)
            .then(response => response.text())
            .then(jsonContent => ({ jsonName, jsonContent }));
        }))
          .then(jsonFiles => {
            setJsonIndexMap(newJsonIndexMap);
            setJsonFiles(jsonFiles);
            setFilteredJsonFiles(jsonFiles); // Initially display all files
          });
      })
      .catch(error => console.error('Error fetching JSONs:', error));
  }

  useEffect(() => {
    // Fetch the initial list of JSON files
    fetchJsons();
  }, []);

  useEffect(() => {
    let matchedFiles = jsonFiles;

    if (showUnmintedOnly && isFetched) {
      matchedFiles = matchedFiles.filter(({ jsonName }, index) =>
        !projectState.token_ids_minted.includes(index.toString())
      );
    }

    const lowercasedSearchTerm = searchTerm.toLowerCase();
    matchedFiles = matchedFiles.filter(({ jsonName, jsonContent }) =>
      jsonName.toLowerCase().includes(lowercasedSearchTerm) ||
      jsonContent.toLowerCase().includes(lowercasedSearchTerm)
    );

    setFilteredJsonFiles(matchedFiles);
  }, [searchTerm, jsonFiles, showUnmintedOnly, isFetched, projectState]);

  const openImageModal = (jsonName) => {
    // never have multiple modals open
    setIsJsonModalOpen(false);
    setIsMintModalOpen(false);
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
    // never have multiple modals open
    setIsImageModalOpen(false);
    setIsMintModalOpen(false);
    setSelectedJsonName(jsonName);
    setSelectedJsonContent(jsonContent);
    setIsJsonModalOpen(true);
  };

  const openMintModal = (jsonName) => {
    // never have multiple modals open
    setIsImageModalOpen(false);
    setIsJsonModalOpen(false);
    setSelectedJsonName(jsonName);
    setIsMintModalOpen(true);
  }

  const jsonsRemaining = isFetched ? (JSON_COUNT - projectState.token_ids_minted.length) : 0;

  return (
    <div className="flex flex-col w-full items-center">
      <div className={`flex flex-row justify-between items-center w-128 my-4 ring-1 ring-lightgray rounded bg-lightgray bg-opacity-20 transition-opacity duration-1000 ${isFetched ? 'opacity-100' : 'opacity-0'}`}>
        <img src="/left_bracket.svg" alt="Left Bracket" className="h-32 w-auto m-2" />

        <div className={`flex flex-col items-center p-4`}>
          <p className="text-white text-xs font-courier mb-0.5">
            Want to own a JSON?
          </p>
          <p className="text-white text-sm font-courier mb-0.5">
            There are
          </p>
          <p className="text-cybergreen font-courier text-4xl text-shadow-cybergreen">
            {jsonsRemaining}
          </p>
          <p className="text-white font-courier mt-0.5 mb-2">
            JSON{jsonsRemaining === 1 ? '' : 's'} remaining
          </p>
          <button
            className="w-40 h-10 ring-2 ring-cybergold text-white hover:text-cybergreen font-bold font-courier py-2 px-4 rounded mt-1"
            onClick={() => openMintModal()}
            disabled={!isFetched || jsonsRemaining === 0}
            style={{ backgroundImage: 'url(/json_matrix.svg)', backgroundSize: 'cover' }}
          >
            Mint Now!
          </button>
        </div>

        <img src="/right_bracket.svg" alt="Right Bracket" className="h-32 w-auto m-2" />
      </div>

      <div className="flex flex-col items-center mt-2">
        <div className="search-bar flex items-center">
          <input
            type="text"
            placeholder="Search JSONs"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="focus:outline-none focus:ring-2 focus:ring-cybergold rounded bg-lightgray font-courier text-darkgray p-1 pl-2 w-64"
          />
          <label className="ml-4 flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={showUnmintedOnly}
              onChange={e => setShowUnmintedOnly(e.target.checked)}
              className="opacity-0 absolute h-8 w-8"
            />
            <span
              className={`checkmark h-4 w-4 bg-black rounded-sm inline-block border border-cybergreen ${showUnmintedOnly ? 'bg-cybergold' : ''
                }`}
            ></span>
            <span className="ml-1 font-courier text-cybergreen">Unminted</span>
          </label>
        </div>
        {(searchTerm || showUnmintedOnly) && (
          <span className="font-courier text-cybergreen text-sm mt-2">
            {`{ ${filteredJsonFiles.length} matching JSON${filteredJsonFiles.length === 1 ? '' : 's'} }`}
          </span>
        )}
      </div>

      <div className="flex flex-wrap justify-center mx-auto py-24 gap-24 w-4/5">
        {filteredJsonFiles.map(({ jsonName, jsonContent }, index) => {
          const originalIndex = jsonIndexMap[jsonName];
          const isMinted = isFetched && projectState.token_ids_minted.includes(originalIndex.toString());
          return (
            <GalleryItem
              key={index}
              jsonName={jsonName}
              jsonContent={jsonContent}
              itemId={index}
              onArtClick={() => openImageModal(jsonName)}
              onJsonClick={() => openJsonModal(jsonName, jsonContent)}
              isMinted={isMinted}
              onMintClick={() => openMintModal(jsonName)}
            />
          );
        })}
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
        <MintModal
          isOpen={isMintModalOpen}
          jsonFiles={filteredJsonFiles}
          selectedJsonName={selectedJsonName}
          onClose={() => setIsMintModalOpen(false)}
        />
      </div>
    </div>
  );
}

export default Gallery;
