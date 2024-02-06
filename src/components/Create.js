import React, { useState } from 'react';
import { resizeImage, drawMosaic } from './MosaicGenerator';
import { ImageModal } from './ImageModal';
import { download, convertTextToPaths } from './SvgUtilities';

function Create() {
  const [uploadedImage, setUploadedImage] = useState(null);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [inputText, setInputText] = useState('');
  const [background, setBackground] = useState('transparent');
  const [rawSvgContent, setRawSvgContent] = useState('');
  const [tempSvgUrl, setTempSvgUrl] = useState('');
  const [dimensions, setDimensions] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    resizeImage(file, (resizedImageBlob) => {
      const resizedImage = new File([resizedImageBlob], "resized_image.jpeg", {
        type: "image/jpeg",
      });
      const img = new Image();
      img.onload = function () {
        setUploadedImage(resizedImage);
        setUploadedFileName(file.name);
      };
      img.src = URL.createObjectURL(resizedImageBlob);
    });
  };

  const handleTextChange = (e) => {
    setInputText(e.target.value);
  };

  const handleBackgroundSelect = (value) => {
    setBackground(value);
  };

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const generateImage = async () => {
    try {
      await drawMosaic(uploadedImage, inputText, background, async (newGeneratedImage, generatedDimensions) => {
        const svgWithPaths = await convertTextToPaths(newGeneratedImage, generatedDimensions);
        const blob = new Blob([svgWithPaths], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        setRawSvgContent(newGeneratedImage);
        setTempSvgUrl(url);
        setDimensions(generatedDimensions);
      });
    } catch (error) {
      console.error('Error in generateImage:', error);
    }
  };

  return (
    <div className="flex flex-col items-center p-3 md:p-5">
      <div className="flex flex-col items-start bg-darkgray px-4 py-3 md:px-8 md:py-6 rounded mb-5 w-3/4 max-w-2xl ring-2 ring-cybergold">
        <div className="flex justify-center pt-3 rounded w-full">
          <input
            type="file"
            accept=".jpeg, .jpg, .png"
            onChange={handleImageUpload}
            id="file-upload"
            className="w-full invisible absolute"
          />
          <label
            htmlFor="file-upload"
            className="cursor-pointer bg-white ring-2 ring-cybergold text-black font-amcap text-xs md:text-base py-2 px-4 rounded flex items-center hover:bg-cybergold"
          >
            <img src="icons/art.png" alt="Upload" className="w-5 h-5 mr-2" />
            <span className="pt-1">Upload Image</span>
          </label>
        </div>
        {uploadedFileName && (
          <div className="w-full flex justify-center text-center font-courier font-bold text-cybergreen text-xs md:text-base mt-2">{uploadedFileName}</div>
        )}
        <textarea
          placeholder="Enter your text here..."
          onChange={handleTextChange}
          className="w-full h-32 md:h-48 mt-5 mb-1 p-2 border rounded bg-lightgray placeholder-mediumgray text-darkgray font-courier text-xs md:text-base custom-scrollbar focus:outline-none"
          spellCheck="false"
        />
        <div className="flex flex-col md:flex-row items-center mt-4 w-full">
          <span className="text-white font-courier text-xs md:text-base mb-2 md:mb-0 md:mr-3">Background:</span>
          <div className="flex flex-col md:flex-row md:flex-grow space-y-1 md:space-y-0 md:space-x-2 w-full">
            <div className="flex-grow">
              <div
                title="transparent"
                onClick={() => handleBackgroundSelect('transparent')}
                className={`h-8 md:h-10 rounded cursor-pointer border-4 ${background === 'transparent' ? 'border-cybergreen' : 'border-transparent'}`}
                style={{ backgroundImage: 'url(/transparent.png)' }}
              />
            </div>
            <div className="flex-grow">
              <div
                title="white"
                onClick={() => handleBackgroundSelect('white')}
                className={`h-8 md:h-10 rounded cursor-pointer border-4 ${background === 'white' ? 'border-cybergreen' : 'border-transparent'} bg-white`}
              />
            </div>
            <div className="flex-grow">
              <div
                title="black"
                onClick={() => handleBackgroundSelect('black')}
                className={`h-8 md:h-10 rounded cursor-pointer border-4 ${background === 'black' ? 'border-cybergreen' : 'border-transparent'} bg-black`}
              />
            </div>
          </div>
        </div>
        <div className="flex w-full mt-6 justify-center">
          <button
            onClick={generateImage}
            disabled={!(uploadedImage && inputText)}
            className={`${(uploadedImage && inputText)
              ? "bg-cybergreen hover:text-white"
              : "bg-lightgreen"
              } text-darkgray text-bold font-amcap text-xs md:text-base pt-1.5 pb-1 px-4 rounded`}
          >
            {tempSvgUrl ? "Re-Generate Image" : "Generate Image"}
          </button>
        </div>
        {tempSvgUrl && (
          <div className="flex w-full justify-center space-x-4 mt-4">
            <button
              onClick={openModal}
              className="bg-white hover:ring-2 hover:ring-cybergreen p-1 md:p-2 rounded"
            >
              <img src="/icons/eye.png" alt="View" className="w-4 h-4 md:w-6 md:h-6" />
            </button>
            <button
              onClick={() => download(rawSvgContent, dimensions, uploadedFileName)}
              className="bg-white hover:ring-2 hover:ring-cybergreen p-1 md:p-2 rounded"
            >
              <img src="/icons/save.png" alt="Save" className="w-4 h-4 md:w-6 md:h-6" />
            </button>
          </div>
        )}

      </div>
      {tempSvgUrl && (
        <img
          src={tempSvgUrl}
          alt="Generated SVG"
          className={`m-4 cursor-pointer ring-2 ring-white md:hover:ring-cybergreen ${
            dimensions.height > dimensions.width ? "h-32 md:h-96" : "w-1/2"
          }`}
          onClick={openModal}
        />
      )}

      {tempSvgUrl &&
        <ImageModal
          isOpen={isModalOpen}
          svgContent={rawSvgContent}
          dimensions={dimensions}
          uploadName={uploadedFileName}
          onClose={closeModal}
        />
      }
    </div>
  );
}

export default Create;
