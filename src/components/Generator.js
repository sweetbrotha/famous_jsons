import React, { useState } from 'react';
import { resizeImage, drawMosaic } from './MosaicGenerator';
import { ImageModal } from './ImageModal';

function Generator() {
  const [uploadedImage, setUploadedImage] = useState(null);
  const [inputText, setInputText] = useState('');
  const [generatedImage, setGeneratedImage] = useState('');
  const [fjChecked, setFjChecked] = useState(false);
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
      };

      img.src = URL.createObjectURL(resizedImageBlob);
    });
  };

  const handleTextChange = (e) => {
    setInputText(e.target.value);
  };

  const handleFJCheckboxChange = (e) => {
    setFjChecked(e.target.checked);
  };

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const generateImage = async () => {
    try {
      await drawMosaic(uploadedImage, inputText, fjChecked, (newGeneratedImage, generatedDimensions) => {
        setGeneratedImage(newGeneratedImage);
        setGeneratedDimensions(generatedDimensions);
      });
    } catch (error) {
      console.error('Error in generateImage:', error);
    }
  };

  return (
    <div className="flex flex-col items-center p-5">
      <div className="flex flex-col items-start bg-gray-200 p-5 rounded mb-5 w-full max-w-md">
        <input type="file" accept=".jpeg, .jpg, .png" onChange={handleImageUpload} className="w-full" />

        <textarea
          placeholder="Enter your text here..."
          onChange={handleTextChange}
          className="w-full mt-2 mb-2 border rounded"
        />
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={fjChecked}
            onChange={handleFJCheckboxChange}
            className="form-checkbox"
          />
          <span>FJ</span>
        </label>
        <button onClick={generateImage} className="bg-blue-500 text-white py-1 px-4 rounded hover:bg-blue-600">
          Generate Image
        </button>
      </div>
      {generatedImage && (
        <div
          className="flex items-center justify-center w-96 h-96 overflow-hidden cursor-pointer"
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
        <ImageModal isOpen={isModalOpen} svgContent={generatedImage} dimensions={generatedDimensions} onClose={closeModal} />
      }
    </div>
  );
}

export default Generator;
