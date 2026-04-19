import Navbar from './Navbar';
import Footer from './Footer';
import '../App.css';

export default function SiteShell({ children }) {
  return (
    <div className="App">
      <Navbar />
      <main className="main-content">
        {children}
      </main>
      <Footer />
    </div>
  );
}
