import React from 'react';

const Footer = () => {
  return (
    <footer className="relative w-full h-24 md:h-48 bg-repeat-x bg-[length:100%] md:bg-[length:33%] animate-slide flex items-end" style={{ backgroundImage: 'url("/json_matrix.svg")' }}>
      {/* Gradient overlay */}
      <div className="absolute top-0 left-0 right-0 h-24 md:h-48 bg-gradient-to-t from-transparent to-black" />
      {/* Copyright text */}
      <div className="z-10 absolute flex w-full h-full justify-center items-center">
        <span
          className="text-xxxs md:text-sm text-white opacity-50 font-courier p-2 rounded bg-black bg-opacity-70 text-shadow-black">
          &copy; 2024 Famous JSONs. All rights reserved.
        </span>
      </div>
    </footer>
  );
};

export default Footer;
