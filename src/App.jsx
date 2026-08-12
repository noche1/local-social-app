import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import Home from './pages/Home'
import RegionSelect from './pages/RegionSelect'
import MapView from './pages/MapView'
import Quiz from './pages/Quiz'
import Result from './pages/Result'

export default function App() {
  return (
    <BrowserRouter>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/regions" element={<RegionSelect />} />
        <Route path="/map/:cityId" element={<MapView />} />
        <Route path="/quiz/:cityId" element={<Quiz />} />
        <Route path="/result/:cityId" element={<Result />} />
      </Routes>
    </BrowserRouter>
  )
}
