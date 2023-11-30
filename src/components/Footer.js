import React from 'react';

const Footer = () => {
  return (
    <footer className="relative w-full h-48 bg-repeat-x bg-[length:33%] animate-slide flex items-end" style={{ backgroundImage: 'url("/json_matrix.svg")' }}>
      {/* Gradient overlay */}
      <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-t from-transparent to-black" />
    </footer>
  );
};

export default Footer;
