import { useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  CaretDown,
  CaretUp,
  ChartLineUp,
  Copy,
  DownloadSimple,
  Table as TableIcon,
} from '@phosphor-icons/react'
import type { SensorReading } from '../types'

type Props = {
  history: SensorReading[]
  loading?: boolean
}

type TimeRange = '24h' | '3d' | '7d' | 'all'

type Point = {
  t: number
  label: string
  fullDate: string
  value: number
  iso: string
  rawRead?: string
}

function toPoints(history: SensorReading[]): Point[] {
  return history.map((r) => {
    const d = new Date(r.updated_at)
    return {
      t: d.getTime(),
      label: d.toLocaleString('ko-KR', {
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      fullDate: d.toLocaleString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
      value: r.value,
      iso: r.updated_at,
      rawRead: r.metadata?.read,
    }
  })
}

function formatValue(v: number): string {
  return v.toLocaleString('en-US', {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  })
}

export function HistoryChart({ history, loading }: Props) {
  const [timeRange, setTimeRange] = useState<TimeRange>('7d')
  const [tableOpen, setTableOpen] = useState(false)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  const allPoints = useMemo(() => toPoints(history), [history])

  // Filter points based on selected time range
  const filteredPoints = useMemo(() => {
    if (allPoints.length === 0) return []
    if (timeRange === 'all') return allPoints

    const now = Date.now()
    const msMap: Record<TimeRange, number> = {
      '24h': 24 * 60 * 60 * 1000,
      '3d': 3 * 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      all: Infinity,
    }
    const cutoff = now - msMap[timeRange]
    const filtered = allPoints.filter((p) => p.t >= cutoff)
    return filtered.length > 0 ? filtered : allPoints
  }, [allPoints, timeRange])

  // Calculations for KPI metric tiles
  const stats = useMemo(() => {
    if (filteredPoints.length === 0) return null
    const values = filteredPoints.map((p) => p.value)
    const min = Math.min(...values)
    const max = Math.max(...values)
    const first = filteredPoints[0]
    const last = filteredPoints[filteredPoints.length - 1]
    const totalUsage = Math.max(0, last.value - first.value)

    const spanHours = Math.max(1, (last.t - first.t) / (1000 * 60 * 60))
    const dailyAvg = (totalUsage / spanHours) * 24

    return {
      min,
      max,
      totalUsage,
      dailyAvg,
      count: filteredPoints.length,
    }
  }, [filteredPoints])

  // CSV Export
  const handleExportCsv = () => {
    if (filteredPoints.length === 0) return
    const headers = ['Timestamp,ISO8601,Reading_m3,Raw_OCR']
    const rows = filteredPoints.map(
      (p) => `"${p.fullDate}","${p.iso}",${p.value},"${p.rawRead || ''}"`,
    )
    const csvContent = [headers, ...rows].join('\n')
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `mqvision_history_${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleCopyRow = (val: number, idx: number) => {
    navigator.clipboard.writeText(val.toFixed(3)).then(() => {
      setCopiedIndex(idx)
      setTimeout(() => setCopiedIndex(null), 1800)
    })
  }

  const tableRows = useMemo(
    () => [...filteredPoints].slice(-60).reverse(),
    [filteredPoints],
  )

  return (
    <section className="history-section" aria-labelledby="history-heading">
      <div className="history-controls">
        <div className="card__title-wrap">
          <ChartLineUp size={18} color="var(--primary)" />
          <h2 className="card__title" id="history-heading">
            가스 소비 추이 분석
          </h2>
          <span className="card__header-tag">{filteredPoints.length}건 기록</span>
        </div>

        <div className="pill-group" role="group" aria-label="조회 기간 선택">
          <button
            type="button"
            className={`pill-btn ${timeRange === '24h' ? 'is-active' : ''}`}
            onClick={() => setTimeRange('24h')}
          >
            24시간
          </button>
          <button
            type="button"
            className={`pill-btn ${timeRange === '3d' ? 'is-active' : ''}`}
            onClick={() => setTimeRange('3d')}
          >
            3일
          </button>
          <button
            type="button"
            className={`pill-btn ${timeRange === '7d' ? 'is-active' : ''}`}
            onClick={() => setTimeRange('7d')}
          >
            7일
          </button>
          <button
            type="button"
            className={`pill-btn ${timeRange === 'all' ? 'is-active' : ''}`}
            onClick={() => setTimeRange('all')}
          >
            전체
          </button>
        </div>
      </div>

      {stats && (
        <div className="metrics-ribbon">
          <div className="metric-card">
            <span className="metric-card__label">기간 내 소비량</span>
            <span className="metric-card__value">
              +{formatValue(stats.totalUsage)}
              <span className="metric-card__unit">m³</span>
            </span>
          </div>

          <div className="metric-card">
            <span className="metric-card__label">일일 환산 소비량</span>
            <span className="metric-card__value">
              ~{formatValue(stats.dailyAvg)}
              <span className="metric-card__unit">m³/일</span>
            </span>
          </div>

          <div className="metric-card">
            <span className="metric-card__label">기간 최저치</span>
            <span className="metric-card__value">
              {formatValue(stats.min)}
              <span className="metric-card__unit">m³</span>
            </span>
          </div>

          <div className="metric-card">
            <span className="metric-card__label">기간 최고치</span>
            <span className="metric-card__value">
              {formatValue(stats.max)}
              <span className="metric-card__unit">m³</span>
            </span>
          </div>
        </div>
      )}

      {loading && allPoints.length === 0 ? (
        <div className="chart-shell" aria-busy="true" aria-label="차트 로딩 중">
          <span className="skeleton skeleton--chart" />
        </div>
      ) : filteredPoints.length === 0 ? (
        <div className="chart-shell chart-shell--empty">
          <p style={{ color: 'var(--muted)' }}>
            선택된 기간의 검침 데이터가 없습니다.
          </p>
        </div>
      ) : (
        <>
          <div className="chart-shell" role="img" aria-hidden="true">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={filteredPoints}
                margin={{ top: 12, right: 16, left: 4, bottom: 4 }}
              >
                <defs>
                  <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-line)" stopOpacity={0.32} />
                    <stop offset="100%" stopColor="var(--chart-line)" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  stroke="var(--chart-grid)"
                  strokeDasharray="3 3"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  tick={{
                    fill: 'var(--muted)',
                    fontSize: 11,
                    fontFamily: 'var(--font-mono)',
                  }}
                  tickLine={false}
                  axisLine={{ stroke: 'var(--border)' }}
                  minTickGap={44}
                />
                <YAxis
                  domain={['auto', 'auto']}
                  tick={{
                    fill: 'var(--muted)',
                    fontSize: 11,
                    fontFamily: 'var(--font-mono)',
                  }}
                  tickLine={false}
                  axisLine={false}
                  width={64}
                  tickFormatter={(v: number) =>
                    v.toLocaleString('en-US', { maximumFractionDigits: 2 })
                  }
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null
                    const p = payload[0].payload as Point
                    const initialVal = filteredPoints[0].value
                    const diff = p.value - initialVal
                    return (
                      <div
                        style={{
                          background: 'var(--surface)',
                          border: '1px solid var(--border)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '0.625rem 0.875rem',
                          boxShadow: 'var(--shadow-md)',
                          fontFamily: 'var(--font-sans)',
                          fontSize: '0.8125rem',
                        }}
                      >
                        <div style={{ color: 'var(--muted)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                          {p.fullDate}
                        </div>
                        <div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', fontSize: '1rem', color: 'var(--fg)' }}>
                          {formatValue(p.value)} <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>m³</span>
                        </div>
                        {diff !== 0 && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--primary)', marginTop: '0.25rem', fontFamily: 'var(--font-mono)' }}>
                            시작 대비 {diff >= 0 ? `+${formatValue(diff)}` : formatValue(diff)} m³
                          </div>
                        )}
                      </div>
                    )
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="var(--chart-line)"
                  strokeWidth={2.5}
                  fill="url(#areaGradient)"
                  isAnimationActive={false}
                  dot={false}
                  activeDot={{
                    r: 4,
                    fill: 'var(--chart-line)',
                    stroke: 'var(--surface)',
                    strokeWidth: 2,
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <details
            className="history-drawer"
            open={tableOpen}
            onToggle={(e) => setTableOpen(e.currentTarget.open)}
          >
            <summary>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <TableIcon size={16} />
                <span>검침 원본 데이터 로그 (최근 {tableRows.length}건)</span>
              </div>
              {tableOpen ? <CaretUp size={14} /> : <CaretDown size={14} />}
            </summary>

            <div className="history-drawer__content">
              <div className="table-toolbar">
                <span style={{ fontSize: '0.8125rem', color: 'var(--muted)' }}>
                  최신순 정렬 (총 {filteredPoints.length}건 중 최대 {tableRows.length}건 표시)
                </span>
                <button
                  type="button"
                  onClick={handleExportCsv}
                  className="btn"
                  title="CSV 파일로 다운로드"
                >
                  <DownloadSimple size={14} />
                  <span>CSV 내보내기</span>
                </button>
              </div>

              <div className="table-scroll" tabIndex={0}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>검침 일시</th>
                      <th>계측값 (m³)</th>
                      <th>직전 대비 (Δ)</th>
                      <th>OCR 원문</th>
                      <th>복사</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableRows.map((row, idx) => {
                      const prevRow = tableRows[idx + 1]
                      const rowDelta = prevRow ? row.value - prevRow.value : null
                      return (
                        <tr key={`${row.iso}-${row.value}`}>
                          <td>
                            <time dateTime={row.iso}>{row.fullDate}</time>
                          </td>
                          <td>
                            <strong>{formatValue(row.value)}</strong>
                          </td>
                          <td className="cell-delta">
                            {rowDelta !== null ? (
                              rowDelta >= 0 ? `+${rowDelta.toFixed(3)}` : rowDelta.toFixed(3)
                            ) : (
                              '-'
                            )}
                          </td>
                          <td style={{ color: 'var(--muted)' }}>
                            {row.rawRead || '-'}
                          </td>
                          <td>
                            <button
                              type="button"
                              onClick={() => handleCopyRow(row.value, idx)}
                              className="btn btn-icon-only"
                              style={{ width: '1.75rem', height: '1.75rem' }}
                              title="계측값 복사"
                              aria-label="계측값 복사"
                            >
                              <Copy size={12} />
                            </button>
                            {copiedIndex === idx && (
                              <span style={{ fontSize: '0.6875rem', color: 'var(--primary)', marginLeft: '0.25rem' }}>
                                완료
                              </span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </details>
        </>
      )}
    </section>
  )
}
