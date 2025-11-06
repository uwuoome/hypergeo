import { BrowserRouter as Router, Routes, Route, Link} from 'react-router-dom';
import HyperGeo from "./components/HyperGeo.tsx";
import Multivariate from "./components/Multivariate.tsx";
import './App.css'
import Home from './components/Home.tsx';
import MonteCarlo from './components/MonteCarlo.tsx';

function App() {
  return (
    <Router>
      <div className="w-[800px]">
        <nav className="flex justify-evenly w-full border-b-2 border-gray-100 mb-4">
          <Link to="/">Home</Link>
          <Link to="/hypergeometric">Hypergeometric</Link>
          <Link to="/multivariate">Multivariate</Link>
          <Link to="/montecarlo">Monte Carlo</Link>
        </nav>
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/hypergeometric" element={<HyperGeo />} />
            <Route path="/multivariate" element={<Multivariate />} />
            <Route path="/montecarlo" element={<MonteCarlo />} /> 
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App
