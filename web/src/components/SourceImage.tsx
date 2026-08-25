import { useEffect, useState } from 'react'
import {
  ArrowSquareOut,
  Camera,
  DownloadSimple,
  MagnifyingGlassPlus,
  X,
} from '@phosphor-icons/react'

type Props = {
  src?: string | null
  loading?: boolean
}

export function SourceImage({ src, loading }: Props) {
  const [failed, setFailed] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    setFailed(false)
  }, [src])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setModalOpen(false)
    }
    if (modalOpen) {
      window.addEventListener('keydown', onKeyDown)
    }
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [modalOpen])

  const showImage = Boolean(src) && !failed

  const handleDownload = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    if (!src) return
    try {
      const response = await fetch(src)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `mqvision_gauge_${new Date().toISOString().replace(/[:.]/g, '-')}.jpg`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch {
      window.open(src, '_blank')
    }
  }

  const handleOpenTab = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    if (src) {
      window.open(src, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <article className="card camera-panel">
      <div className="card__header">
        <div className="card__title-wrap">
          <Camera size={18} color="var(--primary)" />
          <h2 className="card__title" id="image-heading">
            카메라 원본 검증
          </h2>
        </div>
        {showImage && (
          <div className="camera-actions">
            <button
              type="button"
              onClick={handleOpenTab}
              className="btn btn-icon-only"
              title="새 창에서 원본 열기"
              aria-label="새 창에서 원본 이미지 열기"
            >
              <ArrowSquareOut size={16} />
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="btn"
              title="이미지 다운로드"
              aria-label="원본 이미지 다운로드"
            >
              <DownloadSimple size={14} />
              <span>다운로드</span>
            </button>
          </div>
        )}
      </div>

      <div
        className="camera-frame"
        aria-labelledby="image-heading"
        onClick={() => showImage && setModalOpen(true)}
        role={showImage ? 'button' : undefined}
        tabIndex={showImage ? 0 : undefined}
        onKeyDown={(e) => {
          if (showImage && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault()
            setModalOpen(true)
          }
        }}
      >
        {loading && !src ? (
          <span className="skeleton skeleton--image" aria-hidden />
        ) : showImage ? (
          <>
            <img
              src={src!}
              alt="가스 미터 촬영 원본 이미지"
              loading="lazy"
              onError={() => setFailed(true)}
            />
            <div className="camera-frame__status-badge">
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--primary)' }} />
              CAM 01 - PROOF
            </div>
            <div className="camera-frame__overlay" aria-hidden>
              <span className="camera-frame__zoom-badge">
                <MagnifyingGlassPlus size={16} />
                <span>클릭하여 고화질 확대</span>
              </span>
            </div>
          </>
        ) : (
          <div className="camera-frame__empty">
            <Camera size={36} color="var(--muted-subtle)" />
            <p style={{ margin: 0 }}>
              {failed
                ? '이미지를 불러오지 못했습니다. URL이 만료되었거나 접근할 수 없습니다.'
                : '촬영된 카메라 이미지가 없습니다.'}
            </p>
          </div>
        )}
      </div>

      {modalOpen && showImage && (
        <div
          className="modal-backdrop"
          onClick={() => setModalOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="원본 사진 확대 검사"
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">가스 미터 렌즈 캡처 원본</h3>
              <button
                type="button"
                className="btn btn-icon-only"
                onClick={() => setModalOpen(false)}
                aria-label="닫기 (Esc)"
              >
                <X size={16} />
              </button>
            </div>
            <div className="modal-image-wrap">
              <img src={src!} alt="가스 미터 촬영 원본 고화질 확대" />
            </div>
            <div className="modal-footer">
              <span>ESC 키를 누르면 닫힙니다.</span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="btn"
                  onClick={handleOpenTab}
                >
                  <ArrowSquareOut size={14} />
                  <span>새 탭에서 보기</span>
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleDownload}
                >
                  <DownloadSimple size={14} />
                  <span>JPEG 다운로드</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </article>
  )
}
