export default function BigButton({ children, onClick, variant = 'primary', disabled = false }) {
  const bg = variant === 'primary' ? 'var(--color-primary)' : 'var(--color-secondary)'

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: disabled ? '#ccc' : bg,
        color: '#fff',
        border: 'none',
        borderRadius: 'var(--radius-md)',
        padding: '16px 32px',
        fontSize: '20px',
        fontWeight: 700,
        cursor: disabled ? 'not-allowed' : 'pointer',
        boxShadow: 'var(--shadow-soft)',
      }}
    >
      {children}
    </button>
  )
}
