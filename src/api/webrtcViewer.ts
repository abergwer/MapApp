/**
 * WebRTC viewer client.
 *
 * Encapsulates the RTCPeerConnection + Socket.IO signaling dance so UI
 * components only deal with a `MediaStream` and a few callbacks.
 *
 * Wire protocol (matches the broadcaster):
 *   1. Socket connects   → client emits `viewer`
 *   2. Server emits      `offer`     (RTCSessionDescriptionInit)
 *   3. Client emits      `answer`    (RTCSessionDescriptionInit)
 *   4. Both sides emit   `candidate` (RTCIceCandidateInit) as they trickle
 */

import { io, type Socket } from 'socket.io-client';

const DEFAULT_RTC_CONFIG: RTCConfiguration = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
};

export interface WebrtcViewerOptions {
  /** Signaling server origin (e.g. `http://localhost:3000`). */
  signalingUrl: string;
  /** Called once when the first remote track is attached. */
  onTrack: (stream: MediaStream) => void;
  /** Called for transport or negotiation failures. Non-fatal noise is swallowed. */
  onError: (message: string) => void;
  /** Optional override of the RTCPeerConnection config. */
  rtcConfig?: RTCConfiguration;
}

export interface WebrtcViewer {
  /** Disconnect socket, close peer, stop all incoming tracks. Idempotent. */
  stop(): void;
}

/**
 * Start a viewer session. Returns an object with `stop()` for cleanup —
 * call it from `useEffect`'s teardown to fully release resources.
 */
export function createWebrtcViewer(options: WebrtcViewerOptions): WebrtcViewer {
  const { signalingUrl, onTrack, onError, rtcConfig = DEFAULT_RTC_CONFIG } = options;

  let stopped = false;
  const pc = new RTCPeerConnection(rtcConfig);
  const socket: Socket = io(signalingUrl, {
    transports: ['websocket', 'polling'],
    reconnection: false,
    timeout: 2500,
  });
  const stream = new MediaStream();

  // --- Peer connection events ---------------------------------------------

  pc.ontrack = ({ track }) => {
    if (stopped) return;
    stream.addTrack(track);
    onTrack(stream);
  };

  pc.onicecandidate = ({ candidate }) => {
    if (candidate) socket.emit('candidate', candidate);
  };

  pc.onconnectionstatechange = () => {
    if (stopped) return;
    if (['failed', 'disconnected', 'closed'].includes(pc.connectionState)) {
      onError(`Connection ${pc.connectionState}.`);
    }
  };

  // --- Signaling events ---------------------------------------------------

  socket.on('connect', () => socket.emit('viewer'));

  socket.on('connect_error', (err) => {
    if (!stopped) onError(`Signaling unreachable: ${err.message}`);
  });

  socket.on('offer', async (description: RTCSessionDescriptionInit) => {
    try {
      await pc.setRemoteDescription(description);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit('answer', pc.localDescription);
    } catch (err) {
      if (!stopped) {
        onError(err instanceof Error ? err.message : 'Negotiation failed.');
      }
    }
  });

  socket.on('candidate', async (candidate: RTCIceCandidateInit) => {
    try {
      await pc.addIceCandidate(candidate);
    } catch {
      // Late or duplicate ICE candidates are non-fatal — ignore.
    }
  });

  // --- Teardown -----------------------------------------------------------

  return {
    stop() {
      if (stopped) return;
      stopped = true;
      socket.removeAllListeners();
      socket.disconnect();
      pc.getReceivers().forEach((r) => r.track?.stop());
      pc.close();
    },
  };
}
