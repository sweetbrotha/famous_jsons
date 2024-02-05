import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BASE_OPENSEA_URL, CONTRACT_ADDRESS } from './constants';

const Header = () => {
  const location = useLocation();
  const [isHovering, setIsHovering] = useState(false);

  // Check if the current page is the homepage
  const isHomePage = location.pathname === '/';

  return (
    <header className="relative w-full h-24 md:h-48 bg-repeat-x bg-[length:100%] md:bg-[length:33%] animate-slide flex items-start" style={{ backgroundImage: 'url("/json_matrix.svg")' }}>
      <div className="absolute bottom-0 left-0 right-0 h-24 md:h-48 bg-gradient-to-b from-transparent to-black" />
      <div className="flex w-full items-center justify-between py-4 md:py-8 z-10">
        <Link
          to="/"
          className={`flex items-center justify-start ml-2 md:ml-8 ${isHomePage ? 'cursor-default' : 'cursor-pointer'}`}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          <img
            src={isHovering ? "/header_logo_meta.png" : "/header_logo.png"}
            alt="Famous JSONs Logo"
            className="h-10 md:h-24"
          />
          {isHovering && (
            <img
              src="/all_jsons.gif"
              alt="All JSONs"
              className="hidden md:block md:h-24 ml-4 rounded"
            />
          )}
        </Link>

        {/* Navigation links on the right */}
        <nav>
          <ul className="flex items-center space-x-1 md:space-x-4 mr-2 md:mr-8">
            <li className="group">
              <Link to="/create" className="relative font-amcap text-xxs md:text-lg text-white px-1.5 md:px-3 py-2 hover:text-lightgreen hover:text-shadow-cybergreen">
                <span className="hidden md:inline-block absolute left-0 opacity-0 group-hover:opacity-100">{'{'}</span>
                Create
                <span className="hidden md:inline-block absolute right-0 opacity-0 group-hover:opacity-100">{'}'}</span>
              </Link>
            </li>
            <li className="group">
              <Link to="/about" className="relative font-amcap text-xxs md:text-lg text-white px-1.5 md:px-3 py-2 hover:text-lightgreen hover:text-shadow-cybergreen">
                <span className="hidden md:inline-block absolute left-0 opacity-0 group-hover:opacity-100">{'{'}</span>
                About
                <span className="hidden md:inline-block absolute right-0 opacity-0 group-hover:opacity-100">{'}'}</span>
              </Link>
            </li>
            <li className="group">
              <a
                href={`${BASE_OPENSEA_URL}/${CONTRACT_ADDRESS}`}
                target="_blank"
                rel="noopener noreferrer"
                className="relative font-amcap text-xxs md:text-lg text-white px-1.5 md:px-3 py-2 hover:text-lightgreen hover:text-shadow-cybergreen">
                <span className="hidden md:inline-block absolute left-0 opacity-0 group-hover:opacity-100">{'{'}</span>
                OpenSea
                <span className="hidden md:inline-block absolute right-0 opacity-0 group-hover:opacity-100">{'}'}</span>
                <img src="/icons/external_lightgreen.png" alt="External link" className="hidden md:inline-block ml-2 w-3 h-3 mb-1 transition-opacity duration-500 opacity-0 group-hover:opacity-100" />
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;
