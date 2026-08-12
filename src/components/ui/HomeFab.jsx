import { useNavigate } from 'react-router-dom'

export default function HomeFab() {
  const navigate = useNavigate()

  return (
    <button
      onClick={() => navigate('/')}
      aria-label="처음으로"
      title="처음으로"
      style={{
        position: 'fixed',
        right: 'clamp(16px, 2vw, 28px)',
        bottom: 'clamp(16px, 2vw, 28px)',
        width: 'clamp(48px, 5vw, 64px)',
        height: 'clamp(48px, 5vw, 64px)',
        borderRadius: '50%',
        border: 'none',
        background: 'var(--color-primary)',
        color: '#fff',
        fontSize: 'clamp(20px, 2vw, 26px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
        cursor: 'pointer',
        zIndex: 900,
      }}
    >
      🏠
    </button>
  )
}
