import React, { useEffect, useState } from 'react';
import IconButton from './IconButton.js';

export function JsonModal({ isOpen, jsonName, jsonContent, onClose }) {
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('no-scroll');
    } else {
      document.body.classList.remove('no-scroll');
    }
    // Cleanup function to ensure we remove the class when the component unmounts
    return () => {
      document.body.classList.remove('no-scroll');
    };
  }, [isOpen]);

  const handleCopyClick = () => {
    navigator.clipboard.writeText(jsonContent)
      .then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 3000); // Hide the message after 3 seconds
      })
      .catch(error => console.error('Error copying text:', error));
  };

  const renderJsonLines = () => {
    if (!jsonContent) return ("");
    return jsonContent.split('\n').map((line, index) => (
      <div key={index} className="flex">
        <div className="text-gray-500 pr-8">{index + 1}</div>
        <div>{line}</div>
      </div>
    ));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed top-0 left-0 w-full h-full bg-darkgray bg-opacity-95 flex flex-col items-center justify-center z-50 overflow-hidden">
      <button
        onClick={onClose}
        className="absolute top-8 right-8 text-white text-xl font-bold font-courier hover:text-cybergold"
      >
        ×
      </button>
  
      {/* Modal Content Container */}
      <div className="w-4/5 h-4/5 flex flex-col items-center relative">
        {/* Copied to Clipboard Message */}
        <p className={`absolute top-[-1rem] left-1/2 transform -translate-x-1/2 font-courier text-lightgray text-xs text-center transition-opacity duration-1000 ease-in-out ${isCopied ? 'opacity-100' : 'opacity-0'}`}>
          {'{ copied to clipboard }'}
        </p>
  
        {/* Filename Label */}
        <div className="absolute top-[-1.25rem] left-0 font-courier text-cybergold text-sm">
          {`${jsonName}.json`}
        </div>
  
        {/* JSON Content Box */}
        <div className="w-full flex-grow p-16 bg-black rounded overflow-auto custom-scrollbar ring-1 ring-cybergold">
          {/* JSON Content */}
          <div className="font-courier text-sm text-cybergreen whitespace-pre">
            {renderJsonLines()}
          </div>
        </div>
      </div>
  
      {/* Icon Buttons */}
      <div className="flex space-x-6 pt-4">
        <IconButton name="copy" onClick={handleCopyClick} />
        <IconButton name="close" onClick={onClose} />
      </div>
    </div>
  );
  
}

export default JsonModal;
