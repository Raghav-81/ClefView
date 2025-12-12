import React, { useState } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import { AppView } from './types';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);

  return (
    <Layout currentView={currentView} onNavigate={setCurrentView}>
      <Dashboard />
    </Layout>
  );
};

export default App;