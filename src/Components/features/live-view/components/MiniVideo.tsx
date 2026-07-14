import { useEffect, useRef, useState } from 'react';
import { createWebrtcViewer } from '../../../../api/webrtcViewer';
import config from '../../../../../config.json';
import styles from '../../../styles/live-view/MiniVideo.module.css';

interface MiniVideoProps {
  signalingUrl?: string;
  onStatusChange?: (status: 'connecting' | 'live', error: string | null) => void;
}

/**
 * Embedded WebRTC preview — chrome (dock / float) is provided by the parent.
 */
export default function MiniVideo({
  signalingUrl = config.VideoSignalingURL,
  onStatusChange,
}: MiniVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<'connecting' | 'live'>('connecting');

  useEffect(() => {
    const viewer = createWebrtcViewer({
      signalingUrl,
      onTrack: (stream) => {
        if (videoRef.current) videoRef.current.srcObject = stream;
        setStatus('live');
      },
      onError: setError,
    });

    return () => {
      viewer.stop();
      if (videoRef.current) videoRef.current.srcObject = null;
    };
  }, [signalingUrl]);

  useEffect(() => {
    onStatusChange?.(status, error);
  }, [status, error, onStatusChange]);

  return (
    <div className={styles.embeddedRoot}>
      <video ref={videoRef} autoPlay playsInline muted className={styles.embeddedVideo} />
      {(error || status === 'connecting') && (
        <div className={styles.embeddedStatusOverlay}>
          <p className={error ? styles.embeddedStatusTextError : styles.embeddedStatusText}>
            {error ?? 'Connecting…'}
          </p>
        </div>
      )}
    </div>
  );
}
