export default function Header() {
  return (
    <header
      style={{
        padding: '16px 20px',
        borderBottom: '1px solid var(--color-border)',
        background: 'var(--color-card)',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        flexWrap: 'wrap',
      }}
    >
      <h1 style={{ margin: 0, fontSize: '22px' }}>🏫 생활에 도움을 주는 장소 탐험대</h1>
      <span
        style={{
          fontSize: '14px',
          color: '#8a7f6f',
          background: '#f2ede1',
          border: '1px solid var(--color-border)',
          borderRadius: '999px',
          padding: '2px 10px',
          fontWeight: 600,
        }}
      >
        3학년
      </span>
    </header>
  )
}
