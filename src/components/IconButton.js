import React, { useState } from 'react';

const IconButton = ({ name, onClick, disabled, isPressed = false }) => {
  const [isHovered, setIsHovered] = useState(false);
  const iconPath = `/icons/${name}.png`;

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      className="relative group"
    >
      <button
        className={`w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-opacity-50 ${
          (isPressed || disabled) ? 'bg-mediumgray' : 'bg-lightgray'
        }`}
        style={{ boxShadow: 'none' }}
        disabled={disabled}
      >
        <img src={iconPath} alt={name} className={`w-4 h-4 ${isPressed ? 'opacity-100' : 'opacity-80'}`} />
      </button>
      {isHovered && !disabled && (
        <span className="hidden md:inline-block absolute left-1/2 transform -translate-x-1/2 mt-1 whitespace-nowrap px-1 py-0.5 bg-black text-white text-xs rounded-md">
          {name}
        </span>
      )}
    </div>
  );
};

export default IconButton;
