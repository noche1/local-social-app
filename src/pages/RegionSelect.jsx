import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CITIES, CHUNGNAM_CENTER } from '../data/places'
import { CITY_BOUNDARIES } from '../data/cityBoundaries'
import { findCityIdAt } from '../lib/geo'
import { getSchool } from '../lib/school'
import { loadKakaoMapSdk } from '../lib/kakaoLoader'
import BigButton from '../components/ui/BigButton'
import HomeFab from '../components/ui/HomeFab'

// 이 레벨 이하로 확대하면 지도 중심에 있는 시군으로 자동 이동
const AUTO_ENTER_LEVEL = 7

function createCityMarkerElement(city, isSchoolCity) {
  const el = document.createElement('div')
  el.style.cssText =
    'cursor:pointer;font-size:clamp(13px,1.1vw,17px);font-weight:700;color:#fff;white-space:nowrap;' +
    `padding:clamp(6px,0.6vw,10px) clamp(12px,1.1vw,18px);border-radius:999px;box-shadow:0 2px 6px rgba(0,0,0,0.25);` +
    `background:${city.ready ? 'var(--color-primary)' : '#9e9e9e'};` +
    (isSchoolCity ? 'outline:3px solid #f5b301;' : '')
  el.textContent = (isSchoolCity ? '⭐ ' : '') + (city.ready ? `${city.name} ▶` : city.name)
  return el
}

function createMyLocationElement() {
  const el = document.createElement('div')
  el.style.cssText =
    'width:18px;height:18px;border-radius:50%;background:#4285f4;pointer-events:none;' +
    'border:3px solid #fff;box-shadow:0 0 0 4px rgba(66,133,244,0.35);'
  return el
}

export default function RegionSelect() {
  const navigate = useNavigate()
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const myLocationOverlayRef = useRef(null)
  const [sdkError, setSdkError] = useState(null)
  const [locationStatus, setLocationStatus] = useState('idle') // idle | loading | done | error
  const [locationMessage, setLocationMessage] = useState('')

  useEffect(() => {
    let active = true

    loadKakaoMapSdk()
      .then((kakao) => {
        if (!active || !containerRef.current) return

        const map = new kakao.maps.Map(containerRef.current, {
          center: new kakao.maps.LatLng(CHUNGNAM_CENTER.lat, CHUNGNAM_CENTER.lng),
          level: 10,
        })
        mapRef.current = map

        // 시군 경계선 (선만 긋고 색은 칠하지 않음)
        Object.values(CITY_BOUNDARIES).forEach((rings) => {
          rings.forEach((ring) => {
            new kakao.maps.Polyline({
              map,
              path: [...ring, ring[0]].map(([lat, lng]) => new kakao.maps.LatLng(lat, lng)),
              strokeWeight: 2,
              strokeColor: '#b0824a',
              strokeOpacity: 0.55,
              strokeStyle: 'solid',
            })
          })
        })

        // 시군 이름을 누르지 않아도, 지도를 충분히 확대하면 중심에 있는 시군으로 이동
        // (줌 애니메이션 도중에 페이지를 옮기면 카카오맵 내부 상태가 꼬여
        //  다음 지도의 마커가 사라지므로, 애니메이션이 끝나는 300ms 뒤에 이동)
        let entered = false
        kakao.maps.event.addListener(map, 'zoom_changed', () => {
          if (entered || map.getLevel() > AUTO_ENTER_LEVEL) return
          entered = true
          setTimeout(() => {
            const center = map.getCenter()
            const cityId = findCityIdAt(center.getLat(), center.getLng())
            if (cityId) navigate(`/map/${cityId}`)
            else entered = false
          }, 300)
        })

        const bounds = new kakao.maps.LatLngBounds()

        const school = getSchool()
        CITIES.forEach((city) => {
          const el = createCityMarkerElement(city, school?.cityId === city.id)
          el.addEventListener('click', () => navigate(`/map/${city.id}`))

          new kakao.maps.CustomOverlay({
            map,
            position: new kakao.maps.LatLng(city.lat, city.lng),
            content: el,
            yAnchor: 0.5,
            zIndex: 10,
          })

          bounds.extend(new kakao.maps.LatLng(city.lat, city.lng))
        })

        map.setBounds(bounds, 40, 40, 40, 40)

        // 숨겨진 탭/그려지기 전 상태에서 초기화되면 지도가 컨테이너 크기를
        // 잘못 읽을 수 있으므로, 실제로 화면에 그려진 뒤 크기와 범위를 다시 맞춘다
        requestAnimationFrame(() => {
          if (!active) return
          map.relayout()
          map.setBounds(bounds, 40, 40, 40, 40)
        })
      })
      .catch((err) => {
        if (active) setSdkError(err.message)
      })

    return () => {
      active = false
    }
  }, [navigate])

  const handleShowMyLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('error')
      setLocationMessage('이 브라우저에서는 위치 확인을 지원하지 않아요.')
      return
    }

    setLocationStatus('loading')
    setLocationMessage('')

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        const kakao = window.kakao
        const map = mapRef.current
        if (!kakao || !map) return

        const position = new kakao.maps.LatLng(latitude, longitude)

        if (myLocationOverlayRef.current) {
          myLocationOverlayRef.current.setMap(null)
        }
        myLocationOverlayRef.current = new kakao.maps.CustomOverlay({
          map,
          position,
          content: createMyLocationElement(),
          yAnchor: 0.5,
          zIndex: 1,
        })

        map.setCenter(position)
        map.setLevel(9)
        setLocationStatus('done')
        setLocationMessage('파란 점이 지금 내 위치예요!')
      },
      () => {
        setLocationStatus('error')
        setLocationMessage('위치 권한이 없어서 내 위치를 확인할 수 없어요.')
      },
      { timeout: 10000 },
    )
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '16px', gap: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
        <p style={{ margin: 0 }}>충남 지도에서 우리 시군을 눌러보세요. 지도를 확대해도 그 지역으로 들어가요!</p>
        <BigButton variant="secondary" onClick={handleShowMyLocation} disabled={locationStatus === 'loading'}>
          {locationStatus === 'loading' ? '위치 확인 중...' : '내 위치 보기'}
        </BigButton>
      </div>

      {locationMessage && (
        <p style={{ margin: 0, fontSize: '14px', color: locationStatus === 'error' ? '#b3261e' : 'var(--color-text)' }}>
          {locationMessage}
        </p>
      )}

      {sdkError && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            background: '#fdecea',
            color: '#b3261e',
            fontSize: '14px',
          }}
        >
          {sdkError}
        </div>
      )}

      <div
        ref={containerRef}
        style={{
          flex: 1,
          // 화면이 클수록(태블릿·데스크톱) 지도도 더 크게 보이도록 뷰포트 높이에 비례
          minHeight: 'clamp(420px, 68vh, 860px)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-border)',
          background: '#f2f2f2',
        }}
      />

      <HomeFab />
    </div>
  )
}
