import { lazy, Suspense } from 'react';
import { LanguageProvider } from './context/LanguageContext';
import { BrowserRouter, Routes, Route } from "react-router";

import Intro from './pages/Intro';

const SiteShell = lazy(() => import('./components/SiteShell'));
const Home = lazy(() => import('./pages/Home'));
const Videos = lazy(() => import('./pages/Videos'));
const Console = lazy(() => import('./pages/Console'));
const Projects = lazy(() => import('./pages/Projects'));

function withShell(Page) {
	return (
		<Suspense fallback={null}>
			<SiteShell><Page /></SiteShell>
		</Suspense>
	);
}

function AppContent() {
	return (
		<Routes>
			<Route path="/" element={<Intro />} />
			<Route path="/games" element={withShell(Home)} />
			<Route path="/videos" element={withShell(Videos)} />
			<Route path="/pixie" element={withShell(Console)} />
			<Route path="/projects" element={withShell(Projects)} />
		</Routes>
	);
}

function App() {
	return (
		<LanguageProvider>
			<BrowserRouter>
				<AppContent />
			</BrowserRouter>
		</LanguageProvider>
	);
}

export default App;
