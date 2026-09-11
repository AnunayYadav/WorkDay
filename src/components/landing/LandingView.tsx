import React, { useEffect, useRef } from 'react';

interface LandingViewProps {
  onOpenOnboard: () => void;
  onOpenAuth: () => void;
}

const TOTAL_FRAMES = 400;
const FRAMES_PER_DIR = 80;
const LERP_FACTOR = 0.18;

function getFramePath(index: number): string {
  const dirNumber = Math.floor(index / FRAMES_PER_DIR) + 1;
  const fileIndex = (index % FRAMES_PER_DIR) + 1;
  const paddedNumber = String(fileIndex).padStart(3, '0');
  return encodeURI(`/assets/background_frames/Background Assets ${dirNumber}/ffout${paddedNumber}.gif`);
}

export const LandingView: React.FC<LandingViewProps> = ({
  onOpenOnboard,
  onOpenAuth
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoTrackRef = useRef<HTMLElement | null>(null);
  const imagesRef = useRef<(HTMLImageElement | null)[]>(new Array(TOTAL_FRAMES).fill(null));

  // Preload images
  useEffect(() => {
    let mounted = true;
    for (let i = 0; i < TOTAL_FRAMES; i++) {
      const img = new Image();
      img.src = getFramePath(i);
      img.onload = () => {
        if (!mounted) return;
        imagesRef.current[i] = img;
        if (i === 0 && canvasRef.current) {
          drawFrame(0, true);
        }
      };
    }
    return () => {
      mounted = false;
    };
  }, []);

  // Frame drawer helper
  let lastDrawnIndex = -1;
  const drawFrame = (index: number, force = false) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const safeIndex = Math.max(0, Math.min(TOTAL_FRAMES - 1, index));
    if (safeIndex === lastDrawnIndex && !force) return;

    let img = imagesRef.current[safeIndex];
    if (!img || !img.complete || img.naturalWidth === 0) {
      for (let offset = 1; offset < TOTAL_FRAMES; offset++) {
        const prev = safeIndex - offset;
        if (prev >= 0 && imagesRef.current[prev]?.complete && (imagesRef.current[prev]?.naturalWidth || 0) > 0) {
          img = imagesRef.current[prev];
          break;
        }
        const next = safeIndex + offset;
        if (next < TOTAL_FRAMES && imagesRef.current[next]?.complete && (imagesRef.current[next]?.naturalWidth || 0) > 0) {
          img = imagesRef.current[next];
          break;
        }
      }
    }

    if (!img || !img.complete || img.naturalWidth === 0) return;
    lastDrawnIndex = safeIndex;

    const canvasWidth = window.innerWidth;
    const canvasHeight = window.innerHeight;
    const imgWidth = img.naturalWidth || 1280;
    const imgHeight = img.naturalHeight || 720;

    const canvasRatio = canvasWidth / canvasHeight;
    const imgRatio = imgWidth / imgHeight;

    let drawWidth: number;
    let drawHeight: number;
    let offsetX: number;
    let offsetY: number;

    if (canvasRatio > imgRatio) {
      drawWidth = canvasWidth;
      drawHeight = canvasWidth / imgRatio;
      offsetX = 0;
      offsetY = (canvasHeight - drawHeight) / 2;
    } else {
      drawHeight = canvasHeight;
      drawWidth = canvasHeight * imgRatio;
      offsetX = (canvasWidth - drawWidth) / 2;
      offsetY = 0;
    }

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
  };

  // Resize and Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    const videoTrack = videoTrackRef.current;
    if (!canvas || !videoTrack) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const handleResize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.scale(dpr, dpr);
      drawFrame(0, true);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    let animId: number;
    let currentProgress = 0;
    let targetProgress = 0;

    const getScrollProgress = () => {
      const videoTrackTop = videoTrack.offsetTop;
      const videoTrackHeight = videoTrack.offsetHeight - window.innerHeight;
      const scrollY = window.pageYOffset || document.documentElement.scrollTop || 0;

      if (scrollY <= videoTrackTop) return 0;
      if (scrollY >= videoTrackTop + videoTrackHeight) return 1;

      return Math.max(0, Math.min(1, (scrollY - videoTrackTop) / videoTrackHeight));
    };

    const animate = () => {
      targetProgress = getScrollProgress();
      const diff = targetProgress - currentProgress;
      if (Math.abs(diff) > 0.0001) {
        currentProgress += diff * LERP_FACTOR;
      } else {
        currentProgress = targetProgress;
      }

      const frameIndex = Math.round(currentProgress * (TOTAL_FRAMES - 1));
      drawFrame(frameIndex);
      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div id="landingView" className="landing-view">
      {/* 1. Hero Section */}
      <section className="hero-section" id="heroSection">
        <header className="top-nav">
          <div className="nav-brand">VirtualHQ</div>
          <div className="nav-actions-group" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <button
              type="button"
              className="mono"
              onClick={onOpenAuth}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#e4e4e7',
                padding: '0.45rem 0.9rem',
                borderRadius: '999px',
                fontSize: '0.74rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                transition: 'all 0.15s ease'
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
              </svg>
              <span>Sign In / SSO</span>
            </button>
            <button className="nav-cta-btn" id="navOnboardBtn" onClick={onOpenOnboard}>
              Get Started
            </button>
          </div>
        </header>

        <div className="hero-content">
          <span className="hero-eyebrow">Virtual Corporate Platform</span>
          <h1 className="hero-title">The Virtual Corporate Workplace.</h1>
          <p className="hero-subtitle">
            Bridging employees, HR, and leadership in one unified digital headquarters.
          </p>
        </div>

        {/* Minimal Scroll Indicator */}
        <div className="scroll-indicator" id="heroScrollIndicator">
          <div className="scroll-mouse">
            <span className="scroll-wheel"></span>
          </div>
          <span className="scroll-label">Scroll to explore</span>
        </div>
      </section>

      {/* 2. Video Track Section: 100% Clean Video Journey (400 frames) */}
      <section className="video-track" id="videoTrack" ref={videoTrackRef}>
        <div className="video-sticky-wrapper">
          <canvas id="canvas" ref={canvasRef}></canvas>
        </div>
      </section>

      {/* 3. Final Onboarding Trigger Section: Below the video */}
      <section className="cta-section" id="ctaSection">
        <div className="cta-content">
          <span className="cta-eyebrow">Experience The Future</span>
          <h2 className="cta-heading">
            Bring Your Entire Organization<br />Into The Virtual Era.
          </h2>
          <p className="cta-sub">
            Seamless communication, dynamic culture, and cohesive management for your distributed enterprise.
          </p>
          <div className="cta-action-group" style={{ display: 'flex', gap: '0.85rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="primary-onboard-btn" id="onboardMainBtn" onClick={onOpenOnboard}>
              Onboard Your Virtual Company
            </button>
            <button
              type="button"
              onClick={onOpenAuth}
              style={{
                padding: '0.85rem 1.6rem',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#ffffff',
                borderRadius: '980px',
                fontSize: '0.88rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.55rem',
                transition: 'all 0.15s ease'
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
              </svg>
              <span>Sign In with GitHub / SSO</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
