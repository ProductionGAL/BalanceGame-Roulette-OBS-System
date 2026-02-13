import React from 'react';
import DisplayPage from './pages/DisplayPage';
import ControlPage from './pages/ControlPage';
import TopicPage from './pages/TopicPage';

const App: React.FC = () => {
  const path = window.location.pathname;

  if (path === '/control') {
    return <ControlPage />;
  }

  if (path === '/topic') {
    return <TopicPage />;
  }

  // Default: Display page (OBS overlay)
  return <DisplayPage />;
};

export default App;