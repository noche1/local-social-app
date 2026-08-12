import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { CITIES, getPlacesForCity } from '../data/places'
import { getSchool } from '../lib/school'
import { pickQuizzes } from '../data/quizzes'
import BigButton from '../components/ui/BigButton'
import HomeFab from '../components/ui/HomeFab'

export default function Quiz() {
  const navigate = useNavigate()
  const { cityId } = useParams()
  const city = CITIES.find((c) => c.id === cityId)

  const [quizzes] = useState(() => {
    const places = getPlacesForCity(cityId, getSchool())
    return pickQuizzes(places.map((p) => p.category), 5)
  })

  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState(null)
  const [score, setScore] = useState(0)
  const [done, setDone] = useState(false)

  if (quizzes.length === 0) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', padding: '20px', textAlign: 'center' }}>
        <p>이 지역엔 아직 퀴즈 문제가 없어요.</p>
        <BigButton onClick={() => navigate(`/result/${cityId}`)}>탐험 결과 보러 가기</BigButton>
      </div>
    )
  }

  if (done) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px', padding: '20px', textAlign: 'center' }}>
        <h2 style={{ margin: 0, fontSize: 'clamp(24px, 2vw, 30px)' }}>🧩 퀴즈 완료!</h2>
        <p style={{ margin: 0, fontSize: 'clamp(17px, 1.4vw, 22px)', fontWeight: 700 }}>
          {quizzes.length}문제 중 {score}문제를 맞혔어요!
        </p>
        <BigButton onClick={() => navigate(`/result/${cityId}`)}>탐험 결과 보러 가기</BigButton>
        <HomeFab />
      </div>
    )
  }

  const current = quizzes[index]
  const isLast = index === quizzes.length - 1

  const handleChoice = (choice) => {
    if (selected) return
    setSelected(choice)
    if (choice === current.answer) setScore((s) => s + 1)
  }

  const handleNext = () => {
    if (isLast) {
      setDone(true)
      return
    }
    setIndex((i) => i + 1)
    setSelected(null)
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '16px', gap: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
        <h2 style={{ margin: 0, fontSize: 'clamp(20px, 1.6vw, 28px)' }}>
          🧩 {city ? city.name : '우리 고장'} 퀴즈
        </h2>
      </div>

      <div style={{ width: '100%' }}>
        <div
          style={{
            height: '20px',
            borderRadius: '999px',
            background: '#f0ebdd',
            overflow: 'hidden',
            border: '1px solid var(--color-border)',
          }}
        >
          <div
            style={{
              width: `${((index + 1) / quizzes.length) * 100}%`,
              height: '100%',
              background: 'var(--color-primary)',
              transition: 'width 0.3s ease',
            }}
          />
        </div>
        <p style={{ marginTop: '6px', fontSize: '14px', fontWeight: 600 }}>
          {index + 1} / {quizzes.length} 문제
        </p>
      </div>

      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'clamp(16px, 2vw, 28px)',
          padding: '20px',
          textAlign: 'center',
        }}
      >
        <p style={{ margin: 0, fontSize: 'clamp(19px, 1.6vw, 26px)', fontWeight: 700, wordBreak: 'keep-all', maxWidth: 'clamp(400px, 40vw, 640px)' }}>
          {current.question}
        </p>

        <div
          style={{
            width: '100%',
            maxWidth: 'clamp(360px, 32vw, 560px)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '12px',
          }}
        >
          {current.choices.map((choice) => {
            const isAnswer = choice === current.answer
            const isSelected = choice === selected
            let bg = '#fff'
            let border = 'var(--color-border)'
            let color = 'var(--color-text)'
            if (selected) {
              if (isAnswer) {
                bg = '#e8f5e9'
                border = 'var(--color-secondary)'
              } else if (isSelected) {
                bg = '#fdecea'
                border = '#b3261e'
                color = '#b3261e'
              }
            }
            return (
              <button
                key={choice}
                onClick={() => handleChoice(choice)}
                disabled={!!selected}
                style={{
                  background: bg,
                  color,
                  border: `2px solid ${border}`,
                  borderRadius: 'var(--radius-md)',
                  padding: '14px 12px',
                  fontSize: 'clamp(14px, 1.1vw, 17px)',
                  fontWeight: 700,
                  cursor: selected ? 'default' : 'pointer',
                  wordBreak: 'keep-all',
                  boxShadow: 'var(--shadow-soft)',
                }}
              >
                {choice}
              </button>
            )
          })}
        </div>

        {selected && (
          <p style={{ margin: 0, fontSize: 'clamp(15px, 1.2vw, 18px)', fontWeight: 700, wordBreak: 'keep-all' }}>
            {selected === current.answer ? '정답이에요! 🎉' : `아쉬워요. 정답은 "${current.answer}"예요.`}
          </p>
        )}

        {selected && (
          <BigButton onClick={handleNext}>{isLast ? '결과 보기' : '다음 문제'}</BigButton>
        )}
      </div>

      <HomeFab />
    </div>
  )
}
