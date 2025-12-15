import { useState, useEffect } from 'react';
import PromptStudio from './pages/PromptStudio';
import AgentBuilder from './pages/AgentBuilder';
import Home from './pages/Home';
import Layout from './components/Layout';

function App() {
    // Basic Routing Logic since we aren't using React Router (to keep it light for this example)
    const [path, setPath] = useState(window.location.pathname);

    useEffect(() => {
        const handlePopState = () => setPath(window.location.pathname);
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);

    // Helper to render the App Interface (with Sidebar)
    const AppInterface = ({ page }: { page: 'studio' | 'builder' | 'workflow' | 'negotiation' }) => {
        const renderContent = () => {
            switch (page) {
                case 'studio': return <PromptStudio />;
                case 'builder': return <AgentBuilder />;
                default: return <PromptStudio />;
            }
        };

        return (
            <Layout activePage={page}>
                {renderContent()}
            </Layout>
        );
    };

    // Route Matching
    if (path === '/') return <Home />;
    if (path === '/studio') return <AppInterface page="studio" />;
    if (path === '/builder') return <AppInterface page="builder" />;
    if (path === '/dashboard') return <AppInterface page="studio" />; // Use studio as dashboard for now

    // Fallback/404
    return <Home />;
}

export default App;
