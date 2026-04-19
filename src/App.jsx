import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";

import { LanguageProvider } from './context/LanguageContext';
//import { BrowserRouter, Routes, Route } from 'react-router-dom';

import { BrowserRouter, Routes, Route } from "react-router";

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Intro from './pages/Intro';
import Videos from './pages/Videos';
import Console from './pages/Console';
import Projects from './pages/Projects';
import './App.css';

function AppContent() {
	const navigate = useNavigate();
	const params = useParams();
	
	return (
		<div className="App">
			<Routes>
				<Route path="/" element={<Intro />} />
				<Route path="/game" element={
					<>
						<Navbar />
						<main className="main-content">
							<Home />
						</main>
						<Footer />
					</>
				} />
				<Route path="/videos" element={
					<>
						<Navbar />
						<main className="main-content">
							<Videos />
						</main>
						<Footer />
					</>
				} />
				<Route path="/pixie" element={
					<>
						<Navbar />
						<main className="main-content">
							<Console />
						</main>
						<Footer />
					</>
				} />
				<Route path="/projects" element={
					<>
						<Navbar />
						<main className="main-content">
							<Projects />
						</main>
						<Footer />
					</>
				} />
			</Routes>
		</div>
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
