import { BrowserRouter, HashRouter, Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import Home from './pages/Home'
import RegionSelect from './pages/RegionSelect'
import MapView from './pages/MapView'
import Quiz from './pages/Quiz'
import Result from './pages/Result'

// 일반 웹 배포는 BrowserRouter(깔끔한 주소)를 쓰고, USB에서 index.html을
// file://로 직접 열 때는 실제 파일 경로가 곧 URL 경로가 돼버려 어떤 라우트와도
// 안 맞아 화면이 비므로, USB 전용 빌드(vite.config.usb.js)에서만 HashRouter
// (#/regions 같은 해시 기반 경로, file://에서도 정상 동작)를 쓴다.
const Router = import.meta.env.VITE_USB_BUILD ? HashRouter : BrowserRouter

export default function App() {
  return (
    <Router>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/regions" element={<RegionSelect />} />
        <Route path="/map/:cityId" element={<MapView />} />
        <Route path="/quiz/:cityId" element={<Quiz />} />
        <Route path="/result/:cityId" element={<Result />} />
      </Routes>
    </Router>
  )
}
