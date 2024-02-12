import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import About from './components/About';
import Footer from './components/Footer';
import Gallery from './components/Gallery';
import Create from './components/Create';
import Header from './components/Header';
import { ProjectStateProvider } from './components/ProjectStateProvider';
import { Web3Provider } from './components/Web3Provider';
import './App.css';

function ConditionalFooter() {
  const location = useLocation();
  return location.pathname !== '/about' ? <Footer /> : null;
}

function App() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    // Load fonts
    Promise.all([
      new FontFace('Power', 'url("/fonts/power.ttf") format("truetype")').load(),
      new FontFace('Blocky', 'url("/fonts/blocky.otf") format("opentype")').load(),
      new FontFace('Amcap', 'url("/fonts/amcap.otf") format("opentype")').load(),
    ])
    .then((loadedFonts) => {
      loadedFonts.forEach((font) => document.fonts.add(font));
      setFontsLoaded(true);
    })
    .catch((error) => {
      console.error("There was an error loading the fonts: ", error);
    });

    // Disable multi-touch gestures
    const disableZoom = (e) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };

    document.addEventListener('touchstart', disableZoom, { passive: false });
    document.addEventListener('touchmove', disableZoom, { passive: false });

    // Cleanup function
    return () => {
      document.removeEventListener('touchstart', disableZoom);
      document.removeEventListener('touchmove', disableZoom);
    };
  }, []);



  if (!fontsLoaded) {
    return <div className="bg-black min-h-screen text-mediumgray">Loading...</div>;
  }

  return (
    <ProjectStateProvider>
      <Web3Provider>
        <Router>
          <Header />
          <div className="bg-black min-h-screen">
            <Routes>
              <Route path="/" element={<Gallery />} />
              <Route path="/create" element={<Create />} />
              <Route path="/about" element={<About />} />
            </Routes>
          </div>
          <ConditionalFooter />
        </Router>
      </Web3Provider>
    </ProjectStateProvider>
  );
}

export default App;
