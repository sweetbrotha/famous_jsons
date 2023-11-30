import React from 'react';
import { Link } from 'react-router-dom';

const Header = () => {
  return (
    <header className="relative w-full h-48 pt-8 bg-repeat-x bg-[length:33%] animate-slide flex items-start" style={{ backgroundImage: 'url("/json_matrix.svg")' }}>
      <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-b from-transparent to-black" />

      <div className="flex w-full mx-auto items-center justify-between z-10">
        <Link to="/" className="flex justify-start ml-8">
          <img src="/header_logo.svg" alt="Famous JSONs Logo" className="h-14" />
        </Link>

        {/* Navigation links on the right */}
        <nav>
          <ul className="flex items-center space-x-4 mr-8">
            <li className="group">
              <Link to="/create" className="relative font-amcap text-lg text-white group-hover:text-lightgreen px-3 py-2 rounded-md font-medium transition-opacity duration-200 group-hover:text-shadow-cybergreen">
                <span className="absolute left-0 opacity-0 group-hover:opacity-100">{'{'}</span>
                Create
                <span className="absolute right-0 opacity-0 group-hover:opacity-100">{'}'}</span>
              </Link>
            </li>
            <li className="group">
              <Link to="/about" className="relative font-amcap text-lg text-white hover:text-lightgreen px-3 py-2 rounded-md font-medium hover:text-shadow-cybergreen">
                <span className="absolute left-0 opacity-0 group-hover:opacity-100">{'{'}</span>
                About
                <span className="absolute right-0 opacity-0 group-hover:opacity-100">{'}'}</span>
              </Link>
            </li>
            <li className="group">
              <a href="https://opensea.io" target="_blank" rel="noopener noreferrer" className="relative flex items-center text-lg text-white font-amcap hover:text-lightgreen px-3 py-2 rounded-md font-medium group-hover:text-shadow-cybergreen">
                <span className="absolute left-0 opacity-0 group-hover:opacity-100">{'{'}</span>
                OpenSea
                <span className="absolute right-0 opacity-0 group-hover:opacity-100">{'}'}</span>
                <img src="/icons/external_lightgreen.png" alt="External link" className="ml-2 w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;
