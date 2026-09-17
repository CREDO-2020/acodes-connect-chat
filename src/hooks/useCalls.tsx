import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import type { RealtimeChannel } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { CallOverlay } from "@/components/calls/CallOverlay";

export type CallMode = "voice" | "video";
export type CallPhase = "ringing" | "connecting" | "active" | "ended";

export type ActiveCall = {
  id: string;
  mode: CallMode;
  role: "caller" | "callee";
  peerId: string;
  peerName: string;
  phase: CallPhase;
};

type CallContextValue = {
  call: ActiveCall | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  micOn: boolean;
  cameraOn: boolean;
  speakerOn: boolean;
  supported: boolean;
  startCall: (peerId: string, peerName: string, mode: CallMode, conversationId?: string | null) => Promise<void>;
  acceptCall: () => Promise<void>;
  declineCall: () => Promise<void>;
  hangUp: () => Promise<void>;
  toggleMic: () => void;
  toggleCamera: () => void;
  toggleSpeaker: () => void;
};

const CallContext = createContext<CallContextValue | null>(null);

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] },
  ],
};

const RING_TIMEOUT_MS = 40_000;

function mediaSupported() {
  return (
    typeof window !== "undefined" &&
    typeof RTCPeerConnection !== "undefined" &&
    Boolean(navigator.mediaDevices?.getUserMedia)
  );
}

export function CallProvider({ children }: { children: ReactNode }) {
  const { user, profile } = useAuth();
  const [call, setCall] = useState<ActiveCall | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [speakerOn, setSpeakerOn] = useState(true);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const localRef = useRef<MediaStream | null>(null);
  const callRef = useRef<ActiveCall | null>(null);
  const pendingIce = useRef<RTCIceCandidateInit[]>([]);
  const ringTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const supported = mediaSupported();

  const teardown = useCallback(() => {
    if (ringTimer.current) clearTimeout(ringTimer.current);
    ringTimer.current = null;
    pendingIce.current = [];
    localRef.current?.getTracks().forEach((t) => t.stop());
    localRef.current = null;
    pcRef.current?.close();
    pcRef.current = null;
    if (channelRef.current) void supabase.removeChannel(channelRef.current);
    channelRef.current = null;
    callRef.current = null;
    setLocalStream(null);
    setRemoteStream(null);
    setCall(null);
    setMicOn(true);
    setCameraOn(true);
    setSpeakerOn(true);
  }, []);

  const setStatus = useCallback(
    async (id: string, status: "accepted" | "declined" | "missed" | "ended") => {
      const patch: Record<string, string> = { status };
      if (status === "accepted") patch['answered_at'] = new Date().toISOString();
      else patch['ended_at'] = new Date().toISOString();
      await supabase.from("calls").update(patch).eq("id", id);
    },
    [],
  );

  const getMedia = useCallback(async (mode: CallMode) => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: mode === "video" ? { width: { ideal: 1280 }, height: { ideal: 720 } } : false,
    });
    localRef.current = stream;
    setLocalStream(stream);
    setCameraOn(mode === "video");
    return stream;
  }, []);

  const createPeer = useCallback(
    (callId: string, stream: MediaStream) => {
      const pc = new RTCPeerConnection(ICE_SERVERS);
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      const incoming = new MediaStream();
      setRemoteStream(incoming);

      pc.ontrack = (event) => {
        event.streams[0]?.getTracks().forEach((t) => {
          if (!incoming.getTracks().some((existing) => existing.id === t.id)) incoming.addTrack(t);
        });
        setRemoteStream(new MediaStream(incoming.getTracks()));
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          void channelRef.current?.send({
            type: "broadcast",
            event: "ice",
            payload: { candidate: event.candidate.toJSON() },
          });
        }
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "connected") {
          setCall((c) => (c && c.id === callId ? { ...c, phase: "active" } : c));
        }
        if (pc.connectionState === "failed") {
          toast.error("The call connection dropped");
          void setStatus(callId, "ended");
          teardown();
        }
      };

      pcRef.current = pc;
      return pc;
    },
    [setStatus, teardown],
  );

  const drainIce = useCallback(async () => {
    const pc = pcRef.current;
    if (!pc || !pc.remoteDescription) return;
    for (const candidate of pendingIce.current.splice(0)) {
      try {
        await pc.addIceCandidate(candidate);
      } catch {
        /* ignore stale candidates */
      }
    }
  }, []);

  const joinChannel = useCallback(
    (callId: string, role: "caller" | "callee") => {
      const channel = supabase.channel(`acodes-call-${callId}`, {
        config: { broadcast: { self: false } },
      });

      channel
        .on("broadcast", { event: "ready" }, () => {
          if (role !== "caller") return;
          void (async () => {
            const pc = pcRef.current;
            if (!pc) return;
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            await channel.send({ type: "broadcast", event: "offer", payload: { sdp: offer } });
          })();
        })
        .on("broadcast", { event: "offer" }, ({ payload }) => {
          if (role !== "callee") return;
          void (async () => {
            const pc = pcRef.current;
            if (!pc) return;
            await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
            await drainIce();
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            await channel.send({ type: "broadcast", event: "answer", payload: { sdp: answer } });
          })();
        })
        .on("broadcast", { event: "answer" }, ({ payload }) => {
          if (role !== "caller") return;
          void (async () => {
            const pc = pcRef.current;
            if (!pc || pc.signalingState === "stable") return;
            await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
            await drainIce();
          })();
        })
        .on("broadcast", { event: "ice" }, ({ payload }) => {
          const pc = pcRef.current;
          if (!pc) return;
          if (pc.remoteDescription) void pc.addIceCandidate(payload.candidate).catch(() => {});
          else pendingIce.current.push(payload.candidate);
        })
        .on("broadcast", { event: "hangup" }, () => {
          toast.message("Call ended");
          teardown();
        })
        .subscribe((status) => {
          if (status === "SUBSCRIBED" && role === "callee") {
            void channel.send({ type: "broadcast", event: "ready", payload: {} });
          }
        });

      channelRef.current = channel;
      return channel;
    },
    [drainIce, teardown],
  );

  const startCall = useCallback(
    async (peerId: string, peerName: string, mode: CallMode, conversationId?: string | null) => {
      if (!user) return;
      if (callRef.current) {
        toast.error("You're already on a call");
        return;
      }
      if (!supported) {
        toast.error("This browser doesn't support calls", {
          description: "Try the latest Chrome, Edge, Safari or Firefox over a secure connection.",
        });
        return;
      }

      let stream: MediaStream;
      try {
        stream = await getMedia(mode);
      } catch {
        toast.error("Microphone or camera blocked", {
          description: "Allow access in your browser settings, then try calling again.",
        });
        return;
      }

      const { data, error } = await supabase
        .from("calls")
        .insert({
          caller_id: user.id,
          callee_id: peerId,
          conversation_id: conversationId ?? null,
          mode,
          status: "ringing",
        })
        .select("id")
        .single();

      if (error || !data) {
        stream.getTracks().forEach((t) => t.stop());
        setLocalStream(null);
        toast.error("Couldn't start the call", { description: error?.message });
        return;
      }

      const active: ActiveCall = {
        id: data.id,
        mode,
        role: "caller",
        peerId,
        peerName,
        phase: "ringing",
      };
      callRef.current = active;
      setCall(active);
      createPeer(data.id, stream);
      joinChannel(data.id, "caller");

      ringTimer.current = setTimeout(() => {
        if (callRef.current?.id === data.id && callRef.current.phase !== "active") {
          void setStatus(data.id, "missed");
          toast.message(`${peerName} didn't answer`);
          teardown();
        }
      }, RING_TIMEOUT_MS);
    },
    [user, supported, getMedia, createPeer, joinChannel, setStatus, teardown],
  );

  const acceptCall = useCallback(async () => {
    const active = callRef.current;
    if (!active || active.role !== "callee") return;

    let stream: MediaStream;
    try {
      stream = await getMedia(active.mode);
    } catch {
      toast.error("Microphone or camera blocked", {
        description: "Allow access in your browser settings to answer calls.",
      });
      await setStatus(active.id, "declined");
      teardown();
      return;
    }

    const next: ActiveCall = { ...active, phase: "connecting" };
    callRef.current = next;
    setCall(next);
    createPeer(active.id, stream);
    joinChannel(active.id, "callee");
    await setStatus(active.id, "accepted");
  }, [getMedia, createPeer, joinChannel, setStatus, teardown]);

  const declineCall = useCallback(async () => {
    const active = callRef.current;
    if (!active) return;
    await setStatus(active.id, "declined");
    void channelRef.current?.send({ type: "broadcast", event: "hangup", payload: {} });
    teardown();
  }, [setStatus, teardown]);

  const hangUp = useCallback(async () => {
    const active = callRef.current;
    if (!active) return;
    void channelRef.current?.send({ type: "broadcast", event: "hangup", payload: {} });
    await setStatus(active.id, active.phase === "active" ? "ended" : "missed");
    teardown();
  }, [setStatus, teardown]);

  const toggleMic = useCallback(() => {
    const tracks = localRef.current?.getAudioTracks() ?? [];
    const next = !tracks[0]?.enabled;
    tracks.forEach((t) => (t.enabled = next));
    setMicOn(next);
  }, []);

  const toggleCamera = useCallback(() => {
    const tracks = localRef.current?.getVideoTracks() ?? [];
    if (!tracks.length) return;
    const next = !tracks[0]?.enabled;
    tracks.forEach((t) => (t.enabled = next));
    setCameraOn(next);
  }, []);

  const toggleSpeaker = useCallback(() => setSpeakerOn((v) => !v), []);

  // Incoming calls for this user.
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`acodes-incoming-${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "calls", filter: `callee_id=eq.${user.id}` },
        (payload) => {
          const row = payload.new as {
            id: string;
            caller_id: string;
            mode: CallMode;
            status: string;
          };
          if (row.status !== "ringing" || callRef.current) return;
          void (async () => {
            const { data } = await supabase
              .from("profiles")
              .select("full_name,username")
              .eq("id", row.caller_id)
              .maybeSingle();
            const incoming: ActiveCall = {
              id: row.id,
              mode: row.mode,
              role: "callee",
              peerId: row.caller_id,
              peerName: data?.full_name || data?.username || "Classmate",
              phase: "ringing",
            };
            callRef.current = incoming;
            setCall(incoming);
          })();
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "calls" },
        (payload) => {
          const row = payload.new as { id: string; status: string };
          const active = callRef.current;
          if (!active || active.id !== row.id) return;
          if (row.status === "declined" && active.role === "caller") {
            toast.message(`${active.peerName} declined the call`);
            teardown();
          }
          if (row.status === "ended" || row.status === "missed") teardown();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user, teardown]);

  useEffect(() => () => teardown(), [teardown]);

  const value = useMemo<CallContextValue>(
    () => ({
      call,
      localStream,
      remoteStream,
      micOn,
      cameraOn,
      speakerOn,
      supported,
      startCall,
      acceptCall,
      declineCall,
      hangUp,
      toggleMic,
      toggleCamera,
      toggleSpeaker,
    }),
    [
      call,
      localStream,
      remoteStream,
      micOn,
      cameraOn,
      speakerOn,
      supported,
      startCall,
      acceptCall,
      declineCall,
      hangUp,
      toggleMic,
      toggleCamera,
      toggleSpeaker,
    ],
  );

  return (
    <CallContext.Provider value={value}>
      {children}
      <CallOverlay selfName={profile?.full_name ?? "You"} />
    </CallContext.Provider>
  );
}

export function useCalls() {
  const ctx = useContext(CallContext);
  if (!ctx) throw new Error("useCalls must be used inside CallProvider");
  return ctx;
}
