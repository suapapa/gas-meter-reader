import { useState } from 'react'
import {
  CalendarBlank,
  Check,
  Clock,
  Copy,
  Cpu,
  FileCode,
  TrendUp,
} from '@phosphor-icons/react'
import type { SensorReading, SensorResponse } from '../types'

type Props = {
  sensor: SensorResponse | null
  history?: SensorReading[]
  loading: boolean
}

function formatUpdated(iso: string | undefined): string {
  if (!iso) return '-'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

export function LatestReading({ sensor, history, loading }: Props) {
  const meta = sensor?.metadata
  const [copied, setCopied] = useState(false)

  // Calculate delta from previous reading
  let delta: number | null = null
  let prevUpdatedAt: string | null = null
  if (sensor && history && history.length >= 2) {
    const sorted = [...history].sort(
      (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
    )
    const prev = sorted.find((r) => r.updated_at !== sensor.updated_at)
    if (prev) {
      delta = sensor.value - prev.value
      prevUpdatedAt = prev.updated_at
    }
  }

  const rawVal = meta?.read || (sensor?.value !== undefined ? sensor.value.toFixed(3) : '')
  const parts = rawVal.split('.')
  const rawInt = parts[0] || '0'
  const rawDec = parts[1] || '000'

  // Pad integer to 5 digits for classic analog gas meter dial look
  const paddedInt = rawInt.padStart(5, '0')
  const paddedDec = rawDec.padEnd(3, '0').slice(0, 3)

  const copyText = rawInt.replace(/^0+/, '') || '0'

  const handleCopy = () => {
    if (!copyText) return
    navigator.clipboard.writeText(copyText).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <article className="card">
      <div className="card__header">
        <div className="card__title-wrap">
          <h2 className="card__title" id="latest-heading">
            최신 가스 계측값
          </h2>
          <span className="card__header-tag">Live Sensor</span>
        </div>
        {sensor && copyText && (
          <button
            onClick={handleCopy}
            className="btn"
            aria-label="고지서용 검침 정수값 복사"
            title="고지서 입력용 정수 복사"
          >
            {copied ? (
              <>
                <Check size={14} weight="bold" color="var(--primary)" />
                <span>복사 완료</span>
              </>
            ) : (
              <>
                <Copy size={14} />
                <span>검침값 복사 ({copyText})</span>
              </>
            )}
          </button>
        )}
      </div>

      {loading && !sensor ? (
        <div aria-busy="true" aria-label="검침 데이터 로딩 중">
          <span className="skeleton skeleton--odometer" />
          <span className="skeleton skeleton--line" />
          <span className="skeleton skeleton--line skeleton--line-short" />
        </div>
      ) : !sensor ? (
        <div className="camera-frame__empty">
          <p>아직 수신된 검침값이 없습니다.</p>
          <p style={{ fontSize: '0.8125rem', color: 'var(--muted-subtle)' }}>
            MQTT로 계량기 이미지가 전송되면 자동으로 AI 분석이 시작됩니다.
          </p>
        </div>
      ) : (
        <>
          <div className="odometer-panel">
            <div
              className="odometer-wrapper"
              aria-label={`가스 계측값 ${sensor.value.toFixed(3)} 세제곱미터`}
            >
              <div className="odometer-counter" role="text">
                {paddedInt.split('').map((char, i) => (
                  <span
                    key={`int-${i}`}
                    className="odometer-drum odometer-drum--int"
                    title={`정수 자리 ${5 - i}`}
                  >
                    {char}
                  </span>
                ))}
                <span className="odometer-separator">.</span>
                {paddedDec.split('').map((char, i) => (
                  <span
                    key={`dec-${i}`}
                    className="odometer-drum odometer-drum--dec"
                    title={`소수 자리 ${i + 1}`}
                  >
                    {char}
                  </span>
                ))}
              </div>
              <span className="odometer-unit">m³</span>
            </div>

            <div className="reading-stat-row">
              {delta !== null && (
                <div
                  className={`delta-badge ${delta === 0 ? 'delta-badge--neutral' : ''}`}
                  title={prevUpdatedAt ? `직전 검침(${formatUpdated(prevUpdatedAt)}) 대비` : undefined}
                >
                  <TrendUp size={14} weight="bold" />
                  <span>
                    직전 대비 {delta >= 0 ? `+${delta.toFixed(3)}` : delta.toFixed(3)} m³
                  </span>
                </div>
              )}
              <div style={{ fontSize: '0.75rem', color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
                정밀도: 0.001 m³
              </div>
            </div>
          </div>

          <div className="specs-grid">
            <div className="spec-tile">
              <span className="spec-tile__label">
                <Clock size={14} />
                마지막 검침
              </span>
              <span className="spec-tile__value">
                {formatUpdated(sensor.updated_at)}
              </span>
            </div>

            <div className="spec-tile">
              <span className="spec-tile__label">
                <Cpu size={14} />
                AI 분석 소요
              </span>
              <span className="spec-tile__value">
                {meta?.it_takes || '-'}
              </span>
            </div>

            <div className="spec-tile">
              <span className="spec-tile__label">
                <FileCode size={14} />
                OCR 원문
              </span>
              <span className="spec-tile__value">
                {meta?.read || '-'}
              </span>
            </div>

            <div className="spec-tile">
              <span className="spec-tile__label">
                <CalendarBlank size={14} />
                인식 일자
              </span>
              <span className="spec-tile__value">
                {meta?.date || '-'}
              </span>
            </div>
          </div>
        </>
      )}
    </article>
  )
}
