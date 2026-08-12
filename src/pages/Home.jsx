import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CITIES } from '../data/places'
import { findCityIdAt } from '../lib/geo'
import { getSchool, setSchool, clearSchool } from '../lib/school'
import { loadKakaoMapSdk } from '../lib/kakaoLoader'
import BigButton from '../components/ui/BigButton'

export default function Home() {
  const navigate = useNavigate()
  const [school, setSchoolState] = useState(() => getSchool())
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [status, setStatus] = useState('idle') // idle | searching | done | error
  const [message, setMessage] = useState('')
  const [locating, setLocating] = useState(false)

  const schoolCity = school ? CITIES.find((c) => c.id === school.cityId) : null

  const handleSearch = () => {
    const q = query.trim()
    if (!q) return
    setStatus('searching')
    setMessage('')
    setResults([])

    loadKakaoMapSdk()
      .then((kakao) => {
        const places = new kakao.maps.services.Places()
        places.keywordSearch(q, (data, searchStatus) => {
          if (searchStatus !== kakao.maps.services.Status.OK) {
            setStatus('error')
            setMessage('학교를 찾지 못했어요. 학교 이름을 다시 확인해 주세요.')
            return
          }
          const schools = data
            .filter((d) => /학교/.test(d.category_name) || /학교$/.test(d.place_name))
            .filter((d) => (d.road_address_name || d.address_name || '').startsWith('충남'))
            .slice(0, 5)
          if (schools.length === 0) {
            setStatus('error')
            setMessage('충남 안에서 학교를 찾지 못했어요. 학교 이름을 다시 확인해 주세요.')
            return
          }
          setResults(schools)
          setStatus('done')
        })
      })
      .catch((err) => {
        setStatus('error')
        setMessage(err.message)
      })
  }

  const handlePick = (item) => {
    const lat = Number(item.y)
    const lng = Number(item.x)
    const cityId = findCityIdAt(lat, lng)
    if (!cityId) {
      setMessage('이 학교는 충남 시·군 경계 밖이에요. 다른 학교를 골라 주세요.')
      return
    }
    const picked = {
      name: item.place_name,
      lat,
      lng,
      cityId,
      addr: item.road_address_name || item.address_name || '',
    }
    setSchool(picked)
    setSchoolState(picked)
    setResults([])
    setQuery('')
    setStatus('idle')
    setMessage('')
  }

  const handleClear = () => {
    clearSchool()
    setSchoolState(null)
  }

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setMessage('이 브라우저에서는 위치 확인을 지원하지 않아요.')
      return
    }
    setLocating(true)
    setMessage('')

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false)
        const { latitude: lat, longitude: lng } = pos.coords
        const cityId = findCityIdAt(lat, lng)
        if (!cityId) {
          setMessage('지금 위치가 충남 시·군 경계 밖이에요. 학교 이름으로 찾아 주세요.')
          return
        }
        const picked = { name: '내 위치', lat, lng, cityId }
        setSchool(picked)
        setSchoolState(picked)
      },
      () => {
        setLocating(false)
        setMessage('위치 권한이 없어서 내 위치를 확인할 수 없어요. 학교 이름으로 찾아 주세요.')
      },
      { timeout: 10000 },
    )
  }

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '20px',
        padding: '20px',
        textAlign: 'center',
      }}
    >
      <p style={{ maxWidth: 'clamp(480px, 42vw, 680px)', lineHeight: 1.6, fontSize: 'clamp(15px, 1.1vw, 19px)' }}>
        우리가 사는 곳에서 생활에 도움을 주는 장소를 찾아봐요.
        <br />
        학교 이름으로 찾아도 좋고, 내 위치로 바로 찾아봐도 좋아요.
        <br />
        우리가 사는 곳에서 생활에 도움을 주는 장소를 모두 찾으면, 퀴즈도 풀어 볼 수 있어요!
        <br />
        다른 시·군의 장소들도 살펴볼 수 있어요.
      </p>

      <div
        style={{
          width: 'calc(100% - 8px)',
          maxWidth: 'clamp(480px, 40vw, 640px)',
          background: '#fff',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
      >
        {school ? (
          <>
            <p style={{ margin: 0, fontWeight: 700 }}>
              {school.name === '내 위치'
                ? `⭐ 내 위치 기준 (${schoolCity ? schoolCity.name : '충남'})`
                : `⭐ 우리 학교: ${school.name} (${schoolCity ? schoolCity.name : '충남'})`}
            </p>
            <p style={{ margin: 0, fontSize: '13px', color: '#8a7f6f' }}>
              지도에서 이 기준으로 가장 가까운 시설들이 보여요.
            </p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <BigButton onClick={() => navigate(`/map/${school.cityId}`)}>
                우리 고장 탐험 가기
              </BigButton>
              <BigButton variant="secondary" onClick={handleClear}>
                다시 정하기
              </BigButton>
            </div>
          </>
        ) : (
          <>
            <p style={{ margin: 0, fontWeight: 700 }}>🏫 우리 학교를 찾아볼까요?</p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="학교 이름을 입력하세요 (예: 탕정초등학교)"
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  fontSize: '15px',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                }}
              />
              <BigButton onClick={handleSearch} disabled={status === 'searching'}>
                {status === 'searching' ? '찾는 중...' : '검색'}
              </BigButton>
            </div>
            {results.map((item) => (
              <button
                key={item.id}
                onClick={() => handlePick(item)}
                style={{
                  textAlign: 'left',
                  padding: '10px 12px',
                  fontSize: '14px',
                  background: '#faf6ee',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                }}
              >
                <strong>{item.place_name}</strong>
                <span style={{ color: '#8a7f6f' }}>
                  {' '}
                  — {item.road_address_name || item.address_name}
                </span>
              </button>
            ))}
            {message && (
              <p style={{ margin: 0, fontSize: '13px', color: '#b3261e' }}>{message}</p>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '2px 0' }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }} />
              <span style={{ fontSize: '12px', color: '#8a7f6f' }}>또는</span>
              <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }} />
            </div>

            <BigButton variant="secondary" onClick={handleUseMyLocation} disabled={locating}>
              {locating ? '위치 확인 중...' : '📍 내 위치로 바로 찾기'}
            </BigButton>

            <p style={{ margin: 0, fontSize: '12px', color: '#8a7f6f' }}>
              학교를 정하면(또는 내 위치를 쓰면) 각 시설 중 가장 가까운 곳이 지도에 보여요.
            </p>
          </>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '2px 0' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }} />
          <span style={{ fontSize: '12px', color: '#8a7f6f' }}>또는</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }} />
        </div>

        <BigButton variant="secondary" onClick={() => navigate('/regions')}>
          다른 시·군의 장소 보러 가기
        </BigButton>
      </div>
    </div>
  )
}
