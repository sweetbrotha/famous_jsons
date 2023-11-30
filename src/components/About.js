import React, { useState, useEffect } from 'react';

function About() {
  const [aboutLines, setAboutLines] = useState([]);

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
    let fontSize = 1.4; // Base font size in em
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

      // Email regex
      const emailRegex = /(\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b)/g;
      // URL regex (simple version, for demonstration purposes)
      const urlRegex = /(\bhttps?:\/\/[^\s]+[^.,;:\s]\b)/g;

      // Replace emails and URLs with anchor tags
      let modifiedLine = line
        .replace(emailRegex, (email) => `<a href="mailto:${email}" class="text-cybergreen hover:text-lightgreen underline">${email}</a>`)
        .replace(urlRegex, (url) => `<a href="${url}" class="text-cybergreen hover:text-lightgreen underline" target="_blank">${url}</a>`);

      return (
        <div
          className="text-cybergreen indent-reverse"
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
    <div className="flex flex-col items-center pt-5">
      <div className="w-3/5 pt-10 whitespace-pre-wrap" style={{ fontFamily: 'Courier, monospace', textAlign: 'left' }}>
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
            height: '25%', // Adjust the height to control the fade effect area
            backgroundImage: 'linear-gradient(to bottom, rgba(0, 0, 0, 0), rgba(0, 0, 0, 1))'
          }}
        />
      </div>
    </div>
  );
}

export default About;
