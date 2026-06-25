import React from 'react'

/*
  PixelSprite
  ───────────
  Displays a butterfly image if one exists, or a pixel-art
  placeholder silhouette if it doesn't.

  During the placeholder phase (no real photos yet), every entry
  shows a stylized "?" block that looks intentional rather than broken.

  Props:
    src   — image path string (e.g. "img/001_battus_thumb.jpg")
    alt   — accessible description
    size  — pixel size of the square box (default 56)
*/
export default function PixelSprite({ src, alt, size = 56 }) {
  const [errored, setErrored] = React.useState(false)
  const showPlaceholder = !src || errored

  const boxStyle = {
    width: size,
    height: size,
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'var(--color-bg)',
    imageRendering: 'pixelated',
    overflow: 'hidden',
  }

  if (showPlaceholder) {
    return (
      <div className="pixel-border" style={boxStyle} aria-label={alt}>
        {/*
          The placeholder is a CSS-only pixel butterfly silhouette.
          It uses nested divs to build a recognizable wing shape
          without any image files — pure geometry.
        */}
        <svg
          width={size * 0.7}
          height={size * 0.7}
          viewBox="0 0 16 16"
          style={{ imageRendering: 'pixelated' }}
          aria-hidden="true"
        >
          {/* Left wing */}
          <rect x="2" y="4" width="5" height="4" fill="var(--color-accent-dim)" />
          <rect x="1" y="5" width="1" height="2" fill="var(--color-accent-dim)" />
          <rect x="3" y="3" width="3" height="1" fill="var(--color-accent-dim)" />
          <rect x="2" y="8" width="4" height="3" fill="var(--color-accent-dim)" opacity="0.7" />
          {/* Right wing */}
          <rect x="9" y="4" width="5" height="4" fill="var(--color-accent-dim)" />
          <rect x="14" y="5" width="1" height="2" fill="var(--color-accent-dim)" />
          <rect x="10" y="3" width="3" height="1" fill="var(--color-accent-dim)" />
          <rect x="10" y="8" width="4" height="3" fill="var(--color-accent-dim)" opacity="0.7" />
          {/* Body */}
          <rect x="7" y="3" width="2" height="10" fill="var(--color-text-dim)" />
          {/* Antennae */}
          <rect x="6" y="2" width="1" height="2" fill="var(--color-text-dim)" />
          <rect x="9" y="2" width="1" height="2" fill="var(--color-text-dim)" />
          <rect x="5" y="1" width="1" height="1" fill="var(--color-text-dim)" />
          <rect x="10" y="1" width="1" height="1" fill="var(--color-text-dim)" />
        </svg>
      </div>
    )
  }

  return (
    <div className="pixel-border" style={boxStyle}>
      <img
        src={src}
        alt={alt}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          imageRendering: 'pixelated',
        }}
        onError={() => setErrored(true)}   // Falls back to placeholder on broken path
      />
    </div>
  )
}
