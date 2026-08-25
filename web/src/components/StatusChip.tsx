type Props = {
  label: string
  state: 'ok' | 'bad' | 'unknown'
  detail?: string | null
}

const stateText = {
  ok: '정상',
  bad: '이상',
  unknown: '확인 중',
} as const

export function StatusChip({ label, state, detail }: Props) {
  const isBad = state === 'bad'

  return (
    <div
      className={`status status--${state}`}
      role="status"
      title={detail ? `${label}: ${detail}` : undefined}
    >
      <div className="status__dot-wrap" aria-hidden>
        <span className="status__dot" />
        {state === 'ok' && <span className="status__dot-pulse" />}
      </div>
      <span className="status__label">{label}</span>
      <span className="status__state">{stateText[state]}</span>
      {isBad && detail && (
        <span className="status__detail">({detail})</span>
      )}
    </div>
  )
}
