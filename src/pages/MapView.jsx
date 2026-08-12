import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams, useLocation, Link } from 'react-router-dom'
import { CITIES, CATEGORIES, getPlacesForCity } from '../data/places'
import { getSchool } from '../lib/school'
import { bearingDegrees, distanceMeters, moveToward } from '../lib/geo'
import { loadKakaoMapSdk } from '../lib/kakaoLoader'
import ProgressBar from '../components/ui/ProgressBar'
import BigButton from '../components/ui/BigButton'
import HomeFab from '../components/ui/HomeFab'

function createMarkerElement(place) {
  const wrapper = document.createElement('div')
  wrapper.style.cssText =
    'display:flex;flex-direction:column;align-items:center;gap:2px;cursor:pointer;'

  const circle = document.createElement('div')
  circle.style.cssText =
    'width:clamp(44px,4vw,60px);height:clamp(44px,4vw,60px);border-radius:50%;background:#fff;border:3px solid var(--color-primary);' +
    'display:flex;align-items:center;justify-content:center;font-size:clamp(22px,2vw,30px);' +
    'box-shadow:0 2px 6px rgba(0,0,0,0.25);transition:border-color 0.2s, background 0.2s;'
  circle.textContent = CATEGORIES[place.category].icon

  const label = document.createElement('div')
  label.style.cssText =
    'font-size:clamp(11px,0.9vw,14px);font-weight:700;color:#3a2e1f;background:#fff;' +
    'padding:1px 6px;border-radius:8px;border:1px solid var(--color-border);white-space:nowrap;'
  label.textContent = place.name

  wrapper.appendChild(circle)
  wrapper.appendChild(label)
  return { wrapper, circle }
}

// panoId(도로 위 촬영 지점)가 목표 건물에서 멀리 떨어져 있을 수 있어,
// 화면의 이동 화살표를 몇 번 누르는 것처럼 목표 쪽으로 조금씩 다가가며
// 더 가까운 panoId를 찾는다. 카카오 로드뷰 API엔 "화살표 이동"이 그대로
// 노출돼 있지 않아서, 목표 방향으로 보이지 않는 화면(1x1, 화면 밖)에
// 임시 로드뷰를 띄워 getNearestPanoId를 반복 호출하는 방식으로 흉내낸다.
const HOP_METERS = 18
const MAX_HOPS = 3
const HOP_TIMEOUT_MS = 1500

function getPanoPosition(kakao, roadview, panoId, lookAt) {
  return new Promise((resolve) => {
    let settled = false
    const timer = setTimeout(() => {
      if (settled) return
      settled = true
      resolve(null)
    }, HOP_TIMEOUT_MS)
    const listener = () => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      kakao.maps.event.removeListener(roadview, 'init', listener)
      const p = roadview.getPosition()
      resolve(p ? { lat: p.getLat(), lng: p.getLng() } : null)
    }
    kakao.maps.event.addListener(roadview, 'init', listener)
    roadview.setPanoId(panoId, lookAt)
  })
}

async function refinePanoId(kakao, client, startPanoId, target) {
  const hiddenBox = document.createElement('div')
  hiddenBox.style.cssText = 'position:fixed;left:-9999px;top:-9999px;width:100px;height:100px;'
  document.body.appendChild(hiddenBox)
  const roadview = new kakao.maps.Roadview(hiddenBox)
  const lookAt = new kakao.maps.LatLng(target.lat, target.lng)

  try {
    let panoId = startPanoId
    let pos = await getPanoPosition(kakao, roadview, panoId, lookAt)
    if (!pos) return startPanoId

    for (let i = 0; i < MAX_HOPS; i++) {
      if (distanceMeters(pos.lat, pos.lng, target.lat, target.lng) < 8) break
      const step = moveToward(pos.lat, pos.lng, target.lat, target.lng, HOP_METERS)
      const nextPanoId = await new Promise((res) =>
        client.getNearestPanoId(new kakao.maps.LatLng(step.lat, step.lng), 20, res),
      )
      if (!nextPanoId || nextPanoId === panoId) break
      const nextPos = await getPanoPosition(kakao, roadview, nextPanoId, lookAt)
      if (!nextPos) break
      panoId = nextPanoId
      pos = nextPos
    }
    return panoId
  } finally {
    hiddenBox.remove()
  }
}

export default function MapView() {
  const navigate = useNavigate()
  const location = useLocation()
  const { cityId } = useParams()
  const city = CITIES.find((c) => c.id === cityId)
  // 학교가 설정돼 있으면 카테고리마다 학교에서 가장 가까운 시설이 골라진다.
  // 저장된 '우리 학교'는 그 학교가 있는 시군일 때만 쓰고, 다른 시군을 탐험 중이면
  // RegionSelect가 넘겨준 그 시군의 대표 학교(tempSchool, 저장되지 않는 임시 기준)를 쓴다.
  const savedSchool = useMemo(() => getSchool(), [])
  const tempSchool = location.state?.tempSchool
  const school =
    savedSchool?.cityId === cityId ? savedSchool : tempSchool?.cityId === cityId ? tempSchool : null
  const places = useMemo(() => getPlacesForCity(cityId, school), [cityId, school])
  // 마커끼리 실제로 가까우면(도심 밀집 지역) 화면에서 겹쳐 보여 클릭하기 어려울 수 있어,
  // 이럴 때만 "확대해서 눌러보세요" 안내를 보여준다. 억지로 위치를 벌리면 실제와
  // 다르게 보일 수 있어(축소된 지도에선 몇 십 px만 밀어도 수백 m 떨어져 보임),
  // 위치는 정확히 두고 확대라는 정직한 해결책을 안내하는 쪽을 택함.
  const hasCloseOverlap = useMemo(() => {
    const OVERLAP_METERS = 250
    for (let i = 0; i < places.length; i++) {
      for (let j = i + 1; j < places.length; j++) {
        if (distanceMeters(places[i].lat, places[i].lng, places[j].lat, places[j].lng) < OVERLAP_METERS) {
          return true
        }
      }
    }
    return false
  }, [places])

  const [checkedIds, setCheckedIds] = useState(new Set())
  const [selectedPlace, setSelectedPlace] = useState(null)
  const [sdkError, setSdkError] = useState(null)
  const [roadviewStatus, setRoadviewStatus] = useState('loading') // loading | ok | none

  const containerRef = useRef(null)
  const roadviewRef = useRef(null)
  const markerElsRef = useRef({})
  const handleMarkerClickRef = useRef(() => {})
  handleMarkerClickRef.current = (place) => {
    setRoadviewStatus('loading')
    setSelectedPlace(place)
  }

  // 선택한 장소의 실제 거리뷰(로드뷰) 사진을 모달에 띄움
  useEffect(() => {
    if (!selectedPlace) return
    const kakao = window.kakao
    if (!kakao || !kakao.maps || !roadviewRef.current) {
      setRoadviewStatus('none')
      return
    }

    let cancelled = false
    const position = new kakao.maps.LatLng(selectedPlace.lat, selectedPlace.lng)
    const client = new kakao.maps.RoadviewClient()

    const findPano = (radius, nextRadius) => {
      client.getNearestPanoId(position, radius, async (panoId) => {
        if (cancelled) return
        if (panoId) {
          // 가장 가까운 촬영 지점이 목표 건물에서 도로 건너 멀리 있을 수 있어,
          // 화살표를 눌러 다가가듯 목표 쪽으로 몇 걸음 더 가까운 지점을 찾는다.
          const refinedPanoId = await refinePanoId(kakao, client, panoId, {
            lat: selectedPlace.lat,
            lng: selectedPlace.lng,
          })
          if (cancelled) return

          setRoadviewStatus('ok')
          // 모달이 완전히 그려진 뒤에 로드뷰를 생성해야 투영 중심이 맞음.
          // 두 번의 rAF로 페인트 이후를 보장하고, init에서 relayout으로 마무리.
          requestAnimationFrame(() =>
            requestAnimationFrame(() => {
              if (cancelled || !roadviewRef.current) return
              const roadview = new kakao.maps.Roadview(roadviewRef.current)

              // 카메라가 임의의 방향(도로 진행 방향)이 아니라 실제 목표 건물 쪽을
              // 보도록 방위각을 맞춤. init 시점엔 파노라마 좌표가 아직 null일 때가
              // 있어(NaN pan을 주면 로드뷰 렌더링 자체가 깨짐) 유효할 때만 적용.
              const applyBearing = () => {
                if (cancelled) return
                const panoPos = roadview.getPosition()
                const lat = panoPos && panoPos.getLat()
                const lng = panoPos && panoPos.getLng()
                if (typeof lat === 'number' && typeof lng === 'number' && !Number.isNaN(lat)) {
                  const pan = bearingDegrees(lat, lng, selectedPlace.lat, selectedPlace.lng)
                  roadview.setViewpoint({ pan, tilt: 0, zoom: 0 })
                }
              }

              kakao.maps.event.addListener(roadview, 'init', () => {
                if (cancelled) return
                // 파노라마 투영이 컨테이너 크기에 맞게 잡히도록 여러 번 relayout
                roadview.relayout()
                setTimeout(() => {
                  if (cancelled) return
                  roadview.relayout()
                  applyBearing()
                }, 100)
                setTimeout(() => {
                  if (cancelled) return
                  roadview.relayout()
                  applyBearing()
                }, 400)
              })
              roadview.setPanoId(refinedPanoId, position)
            }),
          )
        } else if (nextRadius) {
          findPano(nextRadius, null)
        } else {
          setRoadviewStatus('none')
        }
      })
    }

    findPano(50, 200)
    return () => {
      cancelled = true
    }
  }, [selectedPlace])

  useEffect(() => {
    if (places.length === 0) return
    let active = true
    const overlays = []

    loadKakaoMapSdk()
      .then((kakao) => {
        if (!active || !containerRef.current) return

        const map = new kakao.maps.Map(containerRef.current, {
          center: new kakao.maps.LatLng(places[0].lat, places[0].lng),
          level: 4,
        })
        // 마커가 겹쳐 보일 때 확대해서 볼 수 있도록 확대/축소 버튼을 항상 보여준다
        // (스크롤·핀치만으론 확대 가능하다는 걸 모르는 아이도 있을 수 있음)
        map.addControl(new kakao.maps.ZoomControl(), kakao.maps.ControlPosition.RIGHT)

        const bounds = new kakao.maps.LatLngBounds()

        places.forEach((place) => {
          const { wrapper, circle } = createMarkerElement(place)
          wrapper.addEventListener('click', () => handleMarkerClickRef.current(place))

          const overlay = new kakao.maps.CustomOverlay({
            map,
            position: new kakao.maps.LatLng(place.lat, place.lng),
            content: wrapper,
            yAnchor: 1,
          })

          overlays.push(overlay)
          markerElsRef.current[place.id] = circle
          bounds.extend(new kakao.maps.LatLng(place.lat, place.lng))
        })

        // 내 위치(GPS) 기준일 때만 별도 마커로 표시.
        // 실제 학교를 지정한 경우엔 '학교' 카테고리 마커 자체가 그 학교이므로
        // 예전처럼 ⭐ 우리 학교 마커를 따로 안 띄운다(중복·혼동 방지).
        if (school && school.cityId === cityId && school.name === '내 위치') {
          const el = document.createElement('div')
          el.style.cssText =
            'display:flex;flex-direction:column;align-items:center;gap:2px;pointer-events:none;'
          el.innerHTML =
            '<div style="width:48px;height:48px;border-radius:50%;background:#fff8e1;border:3px solid #f5b301;' +
            'display:flex;align-items:center;justify-content:center;font-size:24px;' +
            'box-shadow:0 2px 8px rgba(0,0,0,0.3);">⭐</div>' +
            '<div style="font-size:11px;font-weight:700;color:#3a2e1f;background:#fff8e1;' +
            'padding:1px 6px;border-radius:8px;border:1px solid #f5b301;white-space:nowrap;">내 위치</div>'

          const schoolOverlay = new kakao.maps.CustomOverlay({
            map,
            position: new kakao.maps.LatLng(school.lat, school.lng),
            content: el,
            yAnchor: 1,
            zIndex: 20,
          })
          overlays.push(schoolOverlay)
          bounds.extend(new kakao.maps.LatLng(school.lat, school.lng))
        }

        map.setBounds(bounds, 80, 80, 80, 80)

        // 숨겨진 탭/그려지기 전 상태에서 초기화되면 지도가 컨테이너 크기를
        // 잘못 읽을 수 있으므로, 실제로 화면에 그려진 뒤 크기와 범위를 다시 맞춘다
        requestAnimationFrame(() => {
          if (!active) return
          map.relayout()
          map.setBounds(bounds, 80, 80, 80, 80)
          baseLevel = map.getLevel()
        })

        // 처음 화면보다 두 단계 이상 축소하면 시군 선택 화면으로 돌아감
        // (줌 애니메이션 도중에 페이지를 옮기면 지도 상태가 꼬이므로 300ms 뒤에 이동)
        let baseLevel = map.getLevel()
        let left = false
        kakao.maps.event.addListener(map, 'zoom_changed', () => {
          if (left || map.getLevel() < baseLevel + 2) return
          left = true
          setTimeout(() => navigate('/regions'), 300)
        })
      })
      .catch((err) => {
        if (active) setSdkError(err.message)
      })

    return () => {
      active = false
      overlays.forEach((overlay) => overlay.setMap(null))
      markerElsRef.current = {}
    }
  }, [cityId])

  useEffect(() => {
    Object.entries(markerElsRef.current).forEach(([id, el]) => {
      const isChecked = checkedIds.has(Number(id))
      el.style.borderColor = isChecked ? 'var(--color-secondary)' : 'var(--color-primary)'
      el.style.background = isChecked ? '#e8f5e9' : '#fff'
    })
  }, [checkedIds])

  if (!city) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
        <p>존재하지 않는 지역이에요.</p>
        <BigButton onClick={() => navigate('/regions')}>시군 다시 고르기</BigButton>
      </div>
    )
  }

  if (places.length === 0) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', padding: '20px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '24px' }}>{city.name}</h2>
        <p>이 지역은 아직 준비 중이에요. 다른 시군을 골라볼까요?</p>
        <BigButton onClick={() => navigate('/regions')}>시군 다시 고르기</BigButton>
      </div>
    )
  }

  const handleConfirm = (place) => {
    setCheckedIds((prev) => new Set(prev).add(place.id))
    setSelectedPlace(null)
  }

  const allChecked = checkedIds.size === places.length

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '16px', gap: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
        <Link to="/regions" style={{ color: 'var(--color-text)', fontWeight: 600 }}>
          ‹ 시군 다시 고르기
        </Link>
        <h2 style={{ margin: 0, fontSize: 'clamp(20px, 1.6vw, 28px)' }}>{city.name}</h2>
      </div>

      <ProgressBar current={checkedIds.size} total={places.length} />

      {hasCloseOverlap && (
        <p style={{ margin: 0, fontSize: '13px', color: '#8a7f6f', wordBreak: 'keep-all' }}>
          🔍 마커가 겹쳐 보이면, 지도 오른쪽의 + 버튼을 눌러 확대한 다음 하나씩 눌러보세요.
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

      {allChecked && (
        <BigButton variant="secondary" onClick={() => navigate(`/quiz/${cityId}`)}>
          퀴즈 풀러 가기 🧩
        </BigButton>
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

      {selectedPlace && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            background: 'rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={() => setSelectedPlace(null)}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 'var(--radius-lg)',
              padding: 'clamp(20px, 2vw, 32px)',
              width: 'calc(100% - 32px)',
              maxWidth: 'clamp(340px, 32vw, 600px)',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: 0, fontSize: 'clamp(17px, 1.4vw, 22px)' }}>
              {CATEGORIES[selectedPlace.category].icon} {selectedPlace.name}
            </h3>

            <div
              style={{
                position: 'relative',
                height: roadviewStatus === 'none' ? '0' : 'clamp(200px, 24vw, 380px)',
                overflow: 'hidden',
                borderRadius: 'var(--radius-md)',
                border: roadviewStatus === 'ok' ? '1px solid var(--color-border)' : 'none',
                background: '#eef1f4',
                transition: 'height 0.2s',
              }}
            >
              <div ref={roadviewRef} style={{ width: '100%', height: '100%' }} />
              {roadviewStatus === 'loading' && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    color: 'var(--color-text)',
                  }}
                >
                  📷 사진을 불러오는 중...
                </div>
              )}
            </div>
            {roadviewStatus === 'none' && (
              <p style={{ margin: 0, fontSize: '13px', color: '#8a7f6f' }}>
                이 장소는 거리뷰 사진이 없어요.
              </p>
            )}
            {roadviewStatus === 'ok' && (
              <p style={{ margin: 0, fontSize: '12px', color: '#8a7f6f', wordBreak: 'keep-all' }}>
                🔄 건물이 잘 안 보이면, 사진 속 화살표를 눌러 둘러보세요.
              </p>
            )}

            <p style={{ margin: 0, wordBreak: 'keep-all' }}>{selectedPlace.description}</p>
            <BigButton onClick={() => handleConfirm(selectedPlace)}>확인했어요</BigButton>
          </div>
        </div>
      )}

      {!selectedPlace && <HomeFab />}
    </div>
  )
}
