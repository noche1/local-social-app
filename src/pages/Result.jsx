import { useNavigate, useParams } from 'react-router-dom'
import { CITIES, CATEGORIES, CATEGORY_GROUPS, getPlacesForCity } from '../data/places'
import { getSchool } from '../lib/school'
import BigButton from '../components/ui/BigButton'
import HomeFab from '../components/ui/HomeFab'

export default function Result() {
  const navigate = useNavigate()
  const { cityId } = useParams()
  const city = CITIES.find((c) => c.id === cityId)
  const places = getPlacesForCity(cityId, getSchool())
  const placeByCategory = Object.fromEntries(places.map((p) => [p.category, p]))

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '20px',
        padding: '20px 20px 100px',
        textAlign: 'center',
      }}
    >
      <h2 style={{ margin: 0, fontSize: 'clamp(24px, 2vw, 30px)' }}>🎉 미션 완료!</h2>
      <p style={{ margin: 0, wordBreak: 'keep-all' }}>
        {city ? `${city.name}의` : '우리 고장의'} 공공기관을 모두 확인했어요. 교과서 활동지처럼 정리해봤어요.
      </p>

      <div
        style={{
          width: '100%',
          maxWidth: 'clamp(480px, 55vw, 760px)',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
        }}
      >
        {CATEGORY_GROUPS.map((group) => {
          const groupPlaces = group.categories.map((cat) => placeByCategory[cat]).filter(Boolean)
          if (groupPlaces.length === 0) return null
          return (
            <div
              key={group.label}
              style={{
                background: '#fff',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                padding: 'clamp(14px, 1.6vw, 20px)',
                textAlign: 'left',
              }}
            >
              <h3 style={{ margin: '0 0 10px', fontSize: 'clamp(15px, 1.2vw, 18px)', wordBreak: 'keep-all' }}>
                {group.label}
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {groupPlaces.map((place) => (
                  <span
                    key={place.id}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: '#faf6ee',
                      border: '1px solid var(--color-border)',
                      borderRadius: '999px',
                      padding: '6px 14px',
                      fontSize: 'clamp(13px, 1vw, 15px)',
                      fontWeight: 600,
                      wordBreak: 'keep-all',
                    }}
                  >
                    {CATEGORIES[place.category].icon} {place.name}
                  </span>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <BigButton variant="secondary" onClick={() => navigate('/regions')}>
          다른 지역 탐험하기
        </BigButton>
      </div>

      <HomeFab />
    </div>
  )
}
