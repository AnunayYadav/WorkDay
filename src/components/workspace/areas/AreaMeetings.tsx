import React, { useState, useRef, useEffect } from 'react';
import type { EmployeeState } from '../../../types';
import { useToast } from '../../../lib/toast';

interface AreaMeetingsProps {
  employee: EmployeeState;
}

export const AreaMeetings: React.FC<AreaMeetingsProps> = ({ employee }) => {
  const { showToast } = useToast();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const callDuration = '08:42';

  const toggleCamera = async () => {
    if (isCameraActive) {
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
        setMediaStream(null);
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setIsCameraActive(false);
      showToast({ title: 'Camera Off', message: 'Switched to avatar tile.', type: 'info' });
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        setMediaStream(stream);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setIsCameraActive(true);
        showToast({ title: 'Camera Active', message: 'Broadcasting video feed to squad.', type: 'success' });
      } catch (err) {
        console.error('Camera access error:', err);
        showToast({
          title: 'Camera Access Needed',
          message: 'Could not access webcam. Using animated avatar tile instead.',
          type: 'warning'
        });
      }
    }
  };

  const toggleMic = () => {
    setIsMicMuted(!isMicMuted);
    showToast({
      title: !isMicMuted ? 'Microphone Muted' : 'Microphone Unmuted',
      message: !isMicMuted ? 'You are now muted in Room #402.' : 'Squad can hear your audio.',
      type: 'info'
    });
  };

  // Clean up media stream on unmount
  useEffect(() => {
    return () => {
      if (mediaStream) {
        mediaStream.getTracks().forEach(t => t.stop());
      }
    };
  }, [mediaStream]);

  return (
    <section className="workspace-area active" id="areaMeetings">
      <div className="area-header">
        <h1 className="area-title">Meetings — Daily Standup Suite</h1>
        <p className="area-subtitle">Participate in daily engineering standups, coordinate with squad teammates, and review sprint blockers.</p>
      </div>

      <div className="meetings-grid">
        {/* Video & Avatar Call Room Panel */}
        <div className="meetings-video-col">
          <div className="executive-card call-room-card">
            <div className="call-header-bar">
              <div className="call-room-identity">
                <span className="live-recording-dot"></span>
                <span className="room-label">ROOM #402 · DAILY ENGINEERING STANDUP (15 MINS)</span>
              </div>
              <span className="call-duration mono" id="callDurationTimer">{callDuration}</span>
            </div>

            {/* Teammate Call Squares Grid */}
            <div className="call-avatar-grid">
              {/* Tile 1: Marcus Vance */}
              <div className="call-tile speaking">
                <div className="tile-avatar">MV</div>
                <div className="tile-meta">
                  <span className="tile-name">Marcus Vance (Host)</span>
                  <span className="tile-role">Engineering Director</span>
                </div>
                <div className="audio-wave-pulse" title="Speaking">
                  <span></span><span></span><span></span>
                </div>
              </div>

              {/* Tile 2: Devon Reed */}
              <div className="call-tile">
                <div className="tile-avatar">DR</div>
                <div className="tile-meta">
                  <span className="tile-name">Devon Reed</span>
                  <span className="tile-role">Staff Frontend</span>
                </div>
              </div>

              {/* Tile 3: Sarah Chen */}
              <div className="call-tile">
                <div className="tile-avatar">SC</div>
                <div className="tile-meta">
                  <span className="tile-name">Sarah Chen</span>
                  <span className="tile-role">UI Engineer</span>
                </div>
              </div>

              {/* Tile 4: Liam K. */}
              <div className="call-tile">
                <div className="tile-avatar">LK</div>
                <div className="tile-meta">
                  <span className="tile-name">Liam K.</span>
                  <span className="tile-role">QA Lead</span>
                </div>
              </div>

              {/* Tile 5: You */}
              <div className={`call-tile user-tile ${isCameraActive ? 'webcam-active' : ''}`} id="callUserTile">
                <video
                  ref={videoRef}
                  id="userWebcamVideo"
                  className="user-webcam-video"
                  autoPlay
                  playsInline
                  muted
                  style={{ display: isCameraActive ? 'block' : 'none' }}
                />
                {!isCameraActive && (
                  <div className="tile-avatar" id="callUserAvatar">
                    {employee.preferredName?.slice(0, 2).toUpperCase() || 'AM'}
                  </div>
                )}
                <div className="tile-meta">
                  <span className="tile-name" id="callUserName">{employee.fullName} (You)</span>
                  <span className="tile-role" id="callUserRole">{employee.selectedRole?.title || 'Junior Frontend Dev'}</span>
                </div>
                <span className="mic-status-badge" id="callUserMicBadge">
                  {isMicMuted ? 'MIC MUTED' : 'MIC READY'}
                </span>
              </div>
            </div>

            {/* Meeting Control Bar */}
            <div className="call-controls-bar">
              <button
                type="button"
                className={`btn-call-action ${!isMicMuted ? 'active' : ''}`}
                id="btnToggleMic"
                onClick={toggleMic}
              >
                <span>{isMicMuted ? '🎙️ Mic: Muted' : '🎙️ Mic: Unmuted'}</span>
              </button>
              <button
                type="button"
                className={`btn-call-action ${isCameraActive ? 'active' : ''}`}
                id="btnToggleVideo"
                onClick={toggleCamera}
              >
                <span>{isCameraActive ? '📹 Video: On' : '📹 Video: Off'}</span>
              </button>
              <button
                type="button"
                className="btn-call-action standup-action"
                id="btnGiveStandup"
                onClick={() => {
                  showToast({
                    title: 'Standup Update Delivered',
                    message: 'Your engineering update was logged to squad transcript (+20 XP).',
                    type: 'success'
                  });
                }}
              >
                <span>Speak in Standup →</span>
              </button>
            </div>
          </div>
        </div>

        {/* Standup Transcript Column */}
        <div className="meetings-notes-col">
          <div className="executive-card standup-log-card">
            <div className="card-kicker-row">
              <span className="card-kicker">LIVE STANDUP TRANSCRIPT</span>
              <span className="standup-status mono">IN PROGRESS</span>
            </div>

            <div className="standup-stream" id="standupStream">
              <div className="standup-entry">
                <span className="entry-author">Marcus Vance (Host):</span>
                <p className="entry-text">"Good morning squad! Let's do quick updates. Devon, let's hear from you first."</p>
              </div>

              <div className="standup-entry">
                <span className="entry-author">Devon Reed:</span>
                <p className="entry-text">"Yesterday merged PR #81 for GraphQL caching. Today pairing with {employee.preferredName || 'our squad'} on ticket 104 auth boundaries. No blockers."</p>
              </div>

              <div className="standup-entry">
                <span className="entry-author">Sarah Chen:</span>
                <p className="entry-text">"Design token refactor is 100% complete. Responsive tests are green. Ready to review UI components."</p>
              </div>

              <div className="standup-entry" id="userStandupEntry">
                <span className="entry-author" id="entryAuthorName">{employee.fullName} (You):</span>
                <p className="entry-text">"Day 1 on sprint. Working on sprint deliverable and test coverage. Looking forward to PR review with Marcus."</p>
              </div>
            </div>

            {/* Upcoming Meeting Schedule */}
            <div className="upcoming-schedule-box">
              <span className="sched-kicker mono">UPCOMING TODAY</span>
              <div className="mini-sched-list">
                <div className="m-sched-item">
                  <span className="time mono">14:30 UTC</span>
                  <span className="title">1-on-1 Review with Marcus Vance</span>
                </div>
                <div className="m-sched-item">
                  <span className="time mono">16:30 UTC</span>
                  <span className="title">Sprint 01 Backlog Refinement</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
