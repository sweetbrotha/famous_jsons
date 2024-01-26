import React, { createContext, useState, useContext, useEffect } from 'react';

// Create Context
const ProjectStateContext = createContext();

export const useProjectState = () => useContext(ProjectStateContext);

export function ProjectStateProvider({ children }) {
  const [projectState, setProjectState] = useState({
    token_ids_minted: [], // empty state
  });
  const [isFetched, setIsFetched] = useState(false);

  useEffect(() => {
    // Function to fetch project state
    const fetchProjectState = () => {
      fetch('https://us-central1-famousjsons.cloudfunctions.net/api/getState')
        .then(response => response.json())
        .then(projectState => {
          setProjectState(projectState);
          setIsFetched(true);  // Set to true once data is fetched
        })
        .catch(error => console.error('Error fetching project state:', error));
    };

    fetchProjectState(); // initial fetch
    const interval = setInterval(fetchProjectState, 300000); // 5 minutes fetch interval
    return () => clearInterval(interval);
  }, []);

  const updateProjectState = async () => {
    try {
      await fetch('https://us-central1-famousjsons.cloudfunctions.net/api/updateState', { method: 'POST' });
      await new Promise(resolve => setTimeout(resolve, 3000));
      const response = await fetch('https://us-central1-famousjsons.cloudfunctions.net/api/getState');
      const updatedProjectState = await response.json();
      setProjectState(updatedProjectState);
    } catch (error) {
      console.error('Error updating project state:', error);
    }
  };


  return (
    <ProjectStateContext.Provider value={{ projectState, updateProjectState, isFetched }}>
      {children}
    </ProjectStateContext.Provider>
  );
}
