import React, { useState, useEffect } from 'react';
import { useMediaQuery } from './MediaQueryUtils';

function About() {
  const [aboutLines, setAboutLines] = useState([]);
  const isMdOrLarger = useMediaQuery('(min-width: 768px)'); // 'md' breakpoint

  useEffect(() => {
    fetch('/about.json')
      .then(response => response.text())
      .then(text => {
        const lines = text.split('\n');
        setAboutLines(lines);
      })
      .catch(error => console.error('Error loading about.json:', error));
  }, []);

  const renderLines = () => {
    
    let fontSize = isMdOrLarger ? 1.4 : 0.7; // Starting font size (em)
    const fontSizeDecrease = 0.02;
    let opacity = 1.0; // Starting opacity
    const opacityDecrease = 0.035;

    return aboutLines.map((line, index) => {
      const leadingSpaces = line.match(/^(\s*)/)[0].length;
      const paddingLeft = `${leadingSpaces}em`; // about.json uses 2-space indentation
      line = line.trim();

      if (line.includes("\":")) { // indicator of new key-value pair
        fontSize -= fontSizeDecrease;
        opacity -= opacityDecrease;
      }

      const emailRegex = /(\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b)/g; // email regex
      const urlRegex = /(\bhttps?:\/\/[^\s]+[^.,;:\s]\b)/g; // simple URL regex

      // Replace emails and URLs with anchor tags
      let modifiedLine = line
        .replace(emailRegex, (email) => `<a href="mailto:${email}" class="text-cybergreen hover:text-lightgreen underline break-all">${email}</a>`)
        .replace(urlRegex, (url) => `<a href="${url}" class="text-cybergreen hover:text-lightgreen underline break-all" target="_blank">${url}</a>`);

      return (
        <div
          className="text-cybergreen hover:text-cybergold indent-reverse"
          key={index}
          style={{
            fontSize: `${fontSize}em`,
            lineHeight: '2.2em',
            opacity: `${opacity}`,
            paddingLeft: paddingLeft
          }}
          dangerouslySetInnerHTML={{ __html: modifiedLine }}
        />
      );
    });
  };

  return (
    <div className="flex flex-col items-center md:pt-5">
      <div className="w-3/4 md:w-3/5 py-4 md:py-10 whitespace-pre-wrap" style={{ fontFamily: 'Courier, monospace', textAlign: 'left' }}>
        {renderLines()}
      </div>
      <div className="relative w-full">
        <img
          src="/six_jsons.png"
          alt="Six JSONs"
          className="w-full opacity-80"
        />
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '100%',
            height: '25%', // the fade effect area
            backgroundImage: 'linear-gradient(to bottom, rgba(0, 0, 0, 0), rgba(0, 0, 0, 1))'
          }}
        />
      </div>
    </div>
  );
}

export default About;
