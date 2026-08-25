import {
  ArrowsClockwise,
  Gauge,
  Monitor,
  Moon,
  Sun,
} from '@phosphor-icons/react'
import type { HealthResponse } from '../types'
import type { Theme } from '../useTheme'
import { StatusChip } from './StatusChip'

type Props = {
  health: HealthResponse | null
  lastFetchedAt: Date | null
  loading: boolean
  refreshing: boolean
  theme: Theme
  onThemeChange: (theme: Theme) => void
  onRefresh: () => void
}

function formatTime(d: Date | null): string {
  if (!d) return '-'
  return d.toLocaleString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function toState(
  loading: boolean,
  ok: boolean | undefined,
): 'ok' | 'bad' | 'unknown' {
  if (loading || ok === undefined) return 'unknown'
  return ok ? 'ok' : 'bad'
}

export function HealthBar({
  health,
  lastFetchedAt,
  loading,
  refreshing,
  theme,
  onThemeChange,
  onRefresh,
}: Props) {
  const appOk = health ? health.status === 'ok' : undefined
  const mqttOk = health?.mqtt ? health.mqtt.connected : appOk
  const appDetail =
    health?.status !== 'ok'
      ? (health?.mqtt?.last_error ?? health?.info ?? '앱 상태가 정상이 아닙니다.')
      : health?.info
  const mqttDetail = health?.mqtt?.last_error ?? (
    health?.mqtt && !health.mqtt.connected
      ? 'MQTT 브로커 연결 끊김'
      : null
  )

  return (
    <header className="topbar">
      <div className="brand">
        <div className="brand__logo-wrap" aria-hidden>
          <Gauge size={24} weight="bold" />
        </div>
        <div className="brand__text">
          <div className="brand__title-row">
            <h1 className="brand__name">MQVision</h1>
            <span className="brand__badge">Gas Telemetry</span>
          </div>
          <p className="brand__tag">스마트 가스 검침 스테이션</p>
        </div>
      </div>

      <div className="topbar__actions">
        <StatusChip
          label="App"
          state={toState(loading, appOk)}
          detail={appDetail}
        />
        <StatusChip
          label="MQTT"
          state={toState(loading, mqttOk)}
          detail={mqttDetail}
        />

        <div className="clock-badge" aria-live="polite" title="마지막 동기화 시각">
          <span>동기화:</span>
          <strong>{formatTime(lastFetchedAt)}</strong>
        </div>

        <div className="theme-switch" role="group" aria-label="화면 테마 선택">
          <button
            type="button"
            className={`theme-switch__btn ${theme === 'system' ? 'is-active' : ''}`}
            onClick={() => onThemeChange('system')}
            title="시스템 테마"
            aria-label="시스템 테마"
          >
            <Monitor size={14} weight={theme === 'system' ? 'fill' : 'regular'} />
          </button>
          <button
            type="button"
            className={`theme-switch__btn ${theme === 'light' ? 'is-active' : ''}`}
            onClick={() => onThemeChange('light')}
            title="라이트 모드"
            aria-label="라이트 모드"
          >
            <Sun size={14} weight={theme === 'light' ? 'fill' : 'regular'} />
          </button>
          <button
            type="button"
            className={`theme-switch__btn ${theme === 'dark' ? 'is-active' : ''}`}
            onClick={() => onThemeChange('dark')}
            title="다크 모드"
            aria-label="다크 모드"
          >
            <Moon size={14} weight={theme === 'dark' ? 'fill' : 'regular'} />
          </button>
        </div>

        <button
          type="button"
          className={`btn btn-primary ${refreshing ? 'btn--spinning' : ''}`}
          onClick={onRefresh}
          disabled={refreshing}
          aria-busy={refreshing}
          aria-label={refreshing ? '데이터 동기화 중' : '지금 새로고침 (R)'}
          title="새로고침 (단축키 R)"
        >
          <ArrowsClockwise size={16} weight="bold" />
          <span>{refreshing ? '동기화 중...' : '새로고침'}</span>
        </button>
      </div>
    </header>
  )
}
