import React from 'react'

/*
  PixelSprite — image with DS-style sprite box fallback.
  The grey sprite box with scanlines replicates the center-left
  panel in image 1 of the DS Pokédex.
*/
export default function PixelSprite({ src, alt, size = 56, showScanlines = true }) {
  const [errored, setErrored] = React.useState(false)
  const showPlaceholder = !src || errored

  const boxStyle = {
    width: size,
    height: size,
    flexShrink: 0,
    background: 'var(--grey-sprite)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    imageRendering: 'pixelated',
    boxShadow: 'inset 2px 2px 0 rgba(0,0,0,0.4), inset -1px -1px 0 rgba(255,255,255,0.1)',
  }

  const content = showPlaceholder ? (
    <svg width={size * 0.65} height={size * 0.65} viewBox="0 0 16 16"
      style={{ imageRendering: 'pixelated', opacity: 0.5 }}>
      <rect x="2" y="4" width="5" height="4" fill="#a0a8c8" />
      <rect x="1" y="5" width="1" height="2" fill="#a0a8c8" />
      <rect x="3" y="3" width="3" height="1" fill="#a0a8c8" />
      <rect x="2" y="8" width="4" height="3" fill="#8090b0" />
      <rect x="9" y="4" width="5" height="4" fill="#a0a8c8" />
      <rect x="14" y="5" width="1" height="2" fill="#a0a8c8" />
      <rect x="10" y="3" width="3" height="1" fill="#a0a8c8" />
      <rect x="10" y="8" width="4" height="3" fill="#8090b0" />
      <rect x="7" y="3" width="2" height="10" fill="#c0c8e0" />
      <rect x="6" y="2" width="1" height="2" fill="#c0c8e0" />
      <rect x="9" y="2" width="1" height="2" fill="#c0c8e0" />
      <rect x="5" y="1" width="1" height="1" fill="#c0c8e0" />
      <rect x="10" y="1" width="1" height="1" fill="#c0c8e0" />
    </svg>
  ) : (
    <img src={src} alt={alt}
      style={{ width: '100%', height: '100%', objectFit: 'contain', imageRendering: 'pixelated' }}
      onError={() => setErrored(true)} />
  )

  if (showScanlines) {
    return (
      <div className="scanlines" style={boxStyle} aria-label={alt}>
        {content}
      </div>
    )
  }
  return <div style={boxStyle} aria-label={alt}>{content}</div>
}
