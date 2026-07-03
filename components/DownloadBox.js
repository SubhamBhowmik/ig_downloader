import { useState, useRef, useEffect } from 'react'

export default function DownloadBox() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [downloading, setDownloading] = useState(null)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('Video')
  const inputRef = useRef(null)
  const resultRef = useRef(null)

  const tabs = ['Video', 'Reels', 'Story', 'Photo', 'Carousel']

  async function handleFetch() {
    if (!url.trim()) return
    setLoading(true)
    setResult(null)
    setError('')

    try {
      const res = await fetch(`/api/download?url=${encodeURIComponent(url.trim())}`)
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to fetch video')
        return
      }

      setResult(data)
    } catch (err) {
      setError('Network error. Try again.')
    } finally {
      setLoading(false)
    }
  }

  // Auto-scroll to results on mobile after fetch completes
  useEffect(() => {
    if (result && !loading && resultRef.current) {
      const timer = setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [result, loading])

  async function handleDownload(formatId, quality, type = 'video') {
    // Detect if browser supports the download attribute on anchor tags
    // Firefox Android is the main browser that ignores it
    const supportsDownload = typeof document !== 'undefined' && 'download' in document.createElement('a')
    setDownloading(quality)
    const title = result?.title || 'instagram-video'
    const safeTitle = title.replace(/[^a-zA-Z0-9\u0600-\u06FF\s_-]/g, '').replace(/\s+/g, '-').substring(0, 40)
    const ext = type === 'audio' ? 'mp3' : 'mp4'
    const filename = `${safeTitle}.${ext}`
    const downloadUrl = `/api/download?url=${encodeURIComponent(url.trim())}&format=${formatId}&type=${type}&title=${encodeURIComponent(safeTitle.replace(/-video$|-audio$/, ''))}`

    // Firefox Android doesn't support the download attribute at all
    // Best approach for that browser is to open in a new tab (user can save manually)
    if (!supportsDownload) {
      window.open(downloadUrl, '_blank')
      setTimeout(() => setDownloading(null), 2000)
      return
    }

    try {
      // Fetch the file as a blob first — this avoids Android Chrome's download manager issues
      const response = await fetch(downloadUrl)
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.error || 'Download failed')
      }

      const blob = await response.blob()
      const blobUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)

      // Clean up the blob URL after a delay
      setTimeout(() => {
        URL.revokeObjectURL(blobUrl)
      }, 10000)
    } catch (err) {
      // Fallback: try opening directly in a new tab
      // Works on browsers where blob downloads fail (UC Browser, MIUI Browser, etc.)
      console.warn('Blob download failed, trying direct fallback:', err.message)
      window.open(downloadUrl, '_blank')
    } finally {
      setTimeout(() => setDownloading(null), 2000)
    }
  }

  function formatDuration(seconds) {
    if (!seconds) return ''
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const hasVideos = Array.isArray(result?.videos) && result.videos.length > 0
  const hasAudio = Array.isArray(result?.audio) && result.audio.length > 0

  return (
    <div className="input-card">
      <div className="input-row">
        <input
          ref={inputRef}
          type="text"
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="Paste Instagram link here..."
          onKeyDown={e => e.key === 'Enter' && handleFetch()}
        />
        <button className="btn-paste" onClick={() =>
          navigator.clipboard.readText().then(setUrl)
        }>
          Paste
        </button>
        <button className="btn-download" onClick={handleFetch} disabled={loading}>
          {loading ? '⏳ Fetching...' : '⬇ Download'}
        </button>
      </div>

      {error && <p className="error-msg">{error}</p>}

      <div className="tabs">
        {tabs.map(tab => (
          <button
            key={tab}
            className={`tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {loading && (
        <div className="progress-bar">
          <div className="progress-fill" />
          <span className="progress-text">Fetching video info...</span>
        </div>
      )}

      {result && (
        <div className="result" ref={resultRef}>
          {/* Thumbnail + info */}
          <div className="preview-row">
            <div className="preview-thumb-wrapper">
              <img
                src={`/api/download?url=${encodeURIComponent(url.trim())}&thumb=1`}
                alt={result.title}
                className="preview-thumb"
                onError={(e) => { e.target.style.display = 'none' }}
              />
              <div className="preview-overlay">
                <div className="preview-play-icon">▶</div>
                {result.duration > 0 && (
                  <span className="preview-duration">{formatDuration(result.duration)}</span>
                )}
              </div>
            </div>
            <div className="preview-info">
              <p className="preview-title">{result.title || 'Instagram Video'}</p>
              {hasVideos && <p className="preview-subtitle">{result.videos.length} quality option{result.videos.length > 1 ? 's' : ''}</p>}
            </div>
          </div>

          {/* Two-column layout */}
          <div className="format-columns">
            {/* Left Column — Videos */}
            <div className="format-col">
              <div className="format-col-header video-header">
                <span className="header-icon">🎬</span> Video
              </div>
              <div className="format-list">
                {!hasVideos && <p className="no-formats">No video formats available</p>}
                {hasVideos && result.videos.map(f => (
                  <button
                    key={f.format_id}
                    className="format-btn video-btn"
                    onClick={() => handleDownload(f.format_id, f.quality, 'video')}
                    disabled={downloading === f.quality}
                  >
                    <span className="fb-left">
                      <span className="fb-icon">{downloading === f.quality ? '⏳' : '⬇'}</span>
                      <span className="fb-label">{f.quality}</span>
                      {/* ✅ Fix: use f.ext safely with fallback */}
                      <span className="fb-ext">{(f.ext || 'mp4').toUpperCase()}</span>
                    </span>
                    <span className="fb-right">{f.filesize ? formatSize(f.filesize) : ''}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Right Column — Audio Only */}
            <div className="format-col">
              <div className="format-col-header audio-header">
                <span className="header-icon">🎵</span> Audio
              </div>
              <div className="format-list">
                {!hasAudio && <p className="no-formats">No audio formats available</p>}
                {hasAudio && result.audio.map(f => (
                  <button
                    key={f.format_id}
                    className="format-btn audio-btn"
                    onClick={() => handleDownload(f.format_id, f.quality, 'audio')}
                    disabled={downloading === f.quality}
                  >
                    <span className="fb-left">
                      <span className="fb-icon">{downloading === f.quality ? '⏳' : '🎵'}</span>
                      <span className="fb-label">{f.quality}</span>
                      {/* ✅ Fix: use f.ext safely with fallback */}
                      <span className="fb-ext">{(f.ext || 'mp3').toUpperCase()}</span>
                    </span>
                    <span className="fb-right">{f.filesize ? formatSize(f.filesize) : ''}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <p className="result-note">
            Videos processed from Instagram servers. Audio only downloads available when source has separate audio track.
          </p>
        </div>
      )}
    </div>
  )
}

function formatSize(bytes) {
  if (!bytes) return ''
  const units = ['B', 'KB', 'MB', 'GB']
  let i = 0
  let size = bytes
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024
    i++
  }
  return `${size.toFixed(1)} ${units[i]}`
}