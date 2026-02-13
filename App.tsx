import React from 'react';
import DisplayPage from './pages/DisplayPage';
import ControlPage from './pages/ControlPage';
import TopicPage from './pages/TopicPage';

const BASE_PATH = import.meta.env.BASE_URL.replace(/\/$/, '');

// Handle SPA redirect from 404.html
const redirectParam = new URLSearchParams(window.location.search).get('redirect');
if (redirectParam) {
  const decoded = decodeURIComponent(redirectParam);
  window.history.replaceState(null, '', decoded);
}

const App: React.FC = () => {
  const path = window.location.pathname.replace(BASE_PATH, '') || '/';

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