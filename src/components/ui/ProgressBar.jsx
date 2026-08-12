export default function ProgressBar({ current, total }) {
  const percent = total === 0 ? 0 : Math.round((current / total) * 100)

  return (
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
            width: `${percent}%`,
            height: '100%',
            background: 'var(--color-primary)',
            transition: 'width 0.3s ease',
          }}
        />
      </div>
      <p style={{ marginTop: '6px', fontSize: '14px', fontWeight: 600 }}>
        {current} / {total} 확인 완료
      </p>
    </div>
  )
}
