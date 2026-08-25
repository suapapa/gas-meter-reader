import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { WarningCircle } from '@phosphor-icons/react'
import { fetchHealth, fetchHistory, fetchSensor } from './api'
import { HealthBar } from './components/HealthBar'
import { LatestReading } from './components/LatestReading'
import { SourceImage } from './components/SourceImage'
import type { HealthResponse, SensorReading, SensorResponse } from './types'
import { useTheme } from './useTheme'

const HistoryChart = lazy(() =>
  import('./components/HistoryChart').then((m) => ({ default: m.HistoryChart })),
)

const POLL_MS = 15_000

function settledError(result: PromiseSettledResult<unknown>): string | null {
  if (result.status === 'fulfilled') return null
  const reason = result.reason
  if (reason instanceof Error && reason.message) return reason.message
  return '일부 데이터를 불러오지 못했습니다.'
}

export default function App() {
  const { theme, setTheme } = useTheme()
  const [sensor, setSensor] = useState<SensorResponse | null>(null)
  const [history, setHistory] = useState<SensorReading[]>([])
  const [health, setHealth] = useState<HealthResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastFetchedAt, setLastFetchedAt] = useState<Date | null>(null)

  const refresh = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true)
    const results = await Promise.allSettled([
      fetchSensor(),
      fetchHistory(),
      fetchHealth(),
    ])

    const [sensorResult, historyResult, healthResult] = results
    const errors: string[] = []

    if (sensorResult.status === 'fulfilled') {
      setSensor(sensorResult.value)
    } else {
      errors.push(settledError(sensorResult)!)
    }

    if (historyResult.status === 'fulfilled') {
      setHistory(historyResult.value)
    } else {
      errors.push(settledError(historyResult)!)
    }

    if (healthResult.status === 'fulfilled') {
      setHealth(healthResult.value)
    } else {
      errors.push(settledError(healthResult)!)
    }

    const unique = [...new Set(errors)]
    setError(unique.length ? unique.join(' ') : null)
    if (results.some((r) => r.status === 'fulfilled')) {
      setLastFetchedAt(new Date())
    }
    setLoading(false)
    setRefreshing(false)
  }, [])

  useEffect(() => {
    void refresh()
    const id = window.setInterval(() => {
      if (document.visibilityState === 'visible') void refresh()
    }, POLL_MS)
    return () => window.clearInterval(id)
  }, [refresh])

  // Global Keyboard Shortcut: 'r' or 'R' to refresh
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return
      }
      if (e.key === 'r' || e.key === 'R') {
        if (!e.ctrlKey && !e.metaKey && !e.altKey) {
          e.preventDefault()
          void refresh(true)
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [refresh])

  return (
    <>
      <a className="skip-link" href="#main">
        본문으로 건너뛰기
      </a>

      <div className="app">
        <HealthBar
          health={health}
          lastFetchedAt={lastFetchedAt}
          loading={loading}
          refreshing={refreshing}
          theme={theme}
          onThemeChange={setTheme}
          onRefresh={() => void refresh(true)}
        />

        {error && (
          <div className="alert" role="alert">
            <WarningCircle size={18} weight="bold" />
            <span>{error}</span>
          </div>
        )}

        <main id="main">
          <section className="telemetry-grid" aria-label="실시간 가스 검침 및 영상">
            <LatestReading
              sensor={sensor}
              history={history}
              loading={loading}
            />
            <SourceImage
              src={sensor?.metadata?.src_image_url}
              loading={loading}
            />
          </section>

          <Suspense
            fallback={
              <div className="chart-shell" aria-busy="true">
                <span className="skeleton skeleton--chart" />
              </div>
            }
          >
            <HistoryChart history={history} loading={loading} />
          </Suspense>
        </main>

        <footer className="footer">
          <p>
            MQVision Gas Telemetry &copy; Homin Lee &lt;
            <a href="mailto:i@homin.dev">i@homin.dev</a>
            &gt;
          </p>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--muted-subtle)' }}>
            Refresh interval: 15s (Key: R)
          </p>
        </footer>
      </div>
    </>
  )
}
