import React, { useState } from 'react';
import { resizeImage, drawMosaic } from './MosaicGenerator';
import { ImageModal } from './ImageModal';
import { download } from './SvgUtilities';

function Generator() {
  const [uploadedImage, setUploadedImage] = useState(null);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [inputText, setInputText] = useState('');
  const [background, setBackground] = useState('transparent');
  const [generatedImage, setGeneratedImage] = useState('');
  const [generatedDimensions, setGeneratedDimensions] = useState(null);
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
      await drawMosaic(uploadedImage, inputText, background, (newGeneratedImage, generatedDimensions) => {
        setGeneratedImage(newGeneratedImage);
        setGeneratedDimensions(generatedDimensions);
      });
    } catch (error) {
      console.error('Error in generateImage:', error);
    }
  };

  return (
    <div className="flex flex-col items-center p-5">
      <div className="flex flex-col items-start bg-darkgray px-8 py-6 rounded mb-5 w-3/4 max-w-2xl ring-2 ring-cybergold">
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
            className="cursor-pointer bg-white ring-2 ring-cybergold text-black font-amcap py-2 px-4 rounded flex items-center hover:bg-cybergold"
          >
            <img src="icons/art.png" alt="Upload" className="w-5 h-5 mr-2" />
            <span className="pt-1">Upload Image</span>
          </label>
        </div>
        {uploadedFileName && (
          <div className="w-full flex justify-center font-courier font-bold text-cybergreen mt-2">{uploadedFileName}</div>
        )}
        <textarea
          placeholder="Enter your text here..."
          onChange={handleTextChange}
          className="w-full h-48 mt-5 mb-1 p-2 border rounded bg-lightgray placeholder-mediumgray text-darkgray font-courier custom-scrollbar focus:outline-none"
        />
        <div className="flex items-center mt-4 w-full">
          <span className="text-white font-courier font-bold mr-3">Background:</span>
          <div className="flex flex-grow space-x-2">
            <div className="flex-grow">
              <div
                title="transparent"
                onClick={() => handleBackgroundSelect('transparent')}
                className={`h-10 rounded cursor-pointer border-4 ${background === 'transparent' ? 'border-cybergreen' : 'border-transparent'}`}
                style={{ backgroundImage: 'url(/transparent.png)' }}
              />
            </div>
            <div className="flex-grow">
              <div
                title="white"
                onClick={() => handleBackgroundSelect('white')}
                className={`h-10 rounded cursor-pointer border-4 ${background === 'white' ? 'border-cybergreen' : 'border-transparent'} bg-white`}
              />
            </div>
            <div className="flex-grow">
              <div
                title="black"
                onClick={() => handleBackgroundSelect('black')}
                className={`h-10 rounded cursor-pointer border-4 ${background === 'black' ? 'border-cybergreen' : 'border-transparent'} bg-black`}
              />
            </div>
          </div>
        </div>

        {/* <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={fjChecked}
            onChange={handleFJCheckboxChange}
            className="form-checkbox"
          />
          <span className="text-white">FJ</span>
        </label> */}
        <div className="flex w-full mt-6 justify-center">
          <button
            onClick={generateImage}
            disabled={!(uploadedImage && inputText)}
            className={`${(uploadedImage && inputText)
              ? "bg-cybergreen hover:text-white"
              : "bg-lightgreen"
              } text-darkgray text-bold font-amcap pt-1.5 pb-1 px-4 rounded`}
          >
            {generatedImage ? "Re-Generate Image" : "Generate Image"}
          </button>
        </div>
        {generatedImage && (
          <div className="flex w-full justify-center space-x-4 mt-4">
            <button
              onClick={openModal}
              className="bg-white hover:ring-2 hover:ring-cybergreen p-2 rounded"
            >
              <img src="/icons/eye.png" alt="View" className="w-6 h-6" />
            </button>
            <button
              onClick={() => download(generatedImage, generatedDimensions, uploadedFileName)}
              className="bg-white hover:ring-2 hover:ring-cybergreen p-2 rounded"
            >
              <img src="/icons/save.png" alt="Save" className="w-6 h-6" />
            </button>
          </div>
        )}

      </div>
      {generatedImage && (
        <div
          className="flex items-center justify-center w-128 h-128 overflow-hidden cursor-pointer hover:ring-2 hover:ring-cybergreen"
          onClick={openModal}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox={`0 0 ${generatedDimensions.width} ${generatedDimensions.height}`}
            width="100%"
            height="100%"
            dangerouslySetInnerHTML={{ __html: generatedImage }}
          />
        </div>
      )}

      {generatedImage &&
        <ImageModal isOpen={isModalOpen} svgContent={generatedImage} dimensions={generatedDimensions} uploadName={uploadedFileName} onClose={closeModal} />
      }
    </div>
  );
}

export default Generator;
