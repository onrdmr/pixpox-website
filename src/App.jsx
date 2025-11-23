import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";

import { LanguageProvider } from './context/LanguageContext';
//import { BrowserRouter, Routes, Route } from 'react-router-dom';

import { BrowserRouter, Routes, Route } from "react-router";

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Videos from './pages/Videos';
import Console from './pages/Console';
import Projects from './pages/Projects';
import './App.css';


function App() {
	// const navigate = useNavigate();
	// const params = useParams();
	

	return (

		<LanguageProvider>
		<BrowserRouter>
			<div className="App">
			<Navbar />
			<main className="main-content">
				<Routes>
					<Route path="/" element={<Home />} />
					<Route path="/videos" element={<Videos />} />
					<Route path="/console" element={<Console />} />
					<Route path="/projects" element={<Projects />} />
				</Routes>
			</main>
			<Footer />
			</div>
		</BrowserRouter>
		</LanguageProvider>


		);
}

export default App;
