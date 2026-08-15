import { useEffect, useRef, useState } from "react";
import { Loader2, Mic, Pause, Play, Square, Volume2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { CHAT_MEDIA_BUCKET, encodeChatMedia } from "@/lib/chat-media";
import { voiceNoteScript } from "@/lib/creator-voices";
import { readVisitorName } from "@/lib/visitor-name";

/** Static waveform bars — cheap, and reads instantly as "voice note". */
const BARS = [8, 14, 20, 12, 24, 16, 28, 18, 10, 22, 14, 26, 12, 18, 9, 20, 15, 24, 11, 16];

export function Waveform({ active, className }: { active?: boolean; className?: string }) {
  return (
    <span aria-hidden className={"flex items-end gap-[2px] " + (className ?? "")}>
      {BARS.map((h, i) => (
        <span
          key={i}
          className={"w-[2px] rounded-full bg-current " + (active ? "animate-pulse" : "opacity-60")}
          style={{ height: h, animationDelay: `${i * 60}ms` }}
        />
      ))}
    </span>
  );
}

/** Player for a member's uploaded voice note (signed URL supplied by caller). */
export function VoiceNotePlayer({ url }: { url: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);

  return (
    <span className="flex w-56 max-w-full items-center gap-3 rounded-full bg-foreground/5 px-3 py-2">
      <button
        type="button"
        aria-label={playing ? "Pause voice note" : "Play voice note"}
        onClick={() => {
          const el = audioRef.current;
          if (!el) return;
          if (playing) { el.pause(); setPlaying(false); }
          else { void el.play(); setPlaying(true); }
        }}
        className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-brand text-white shadow-glow"
      >
        {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      </button>
      <Waveform active={playing} className="h-7 flex-1 text-primary" />
      <audio ref={audioRef} src={url} onEnded={() => setPlaying(false)} preload="none" />
    </span>
  );
}

/**
 * Plays a creator's reply in her own voice (TTS). This is the moment the app
 * stops feeling like text on a screen.
 */
export function CreatorVoiceButton({
  text,
  hostId,
  autoPlay,
  label,
  memberName,
}: {
  text: string;
  hostId: string;
  autoPlay?: boolean;
  label?: string;
  /** Falls back to the locally stored visitor name so she says it out loud. */
  memberName?: string | null;
}) {
  const [busy, setBusy] = useState(false);
  const [playing, setPlaying] = useState(false);
  const urlRef = useRef<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const played = useRef(false);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    };
  }, []);

  const play = async () => {
    if (busy) return;
    if (audioRef.current && urlRef.current) {
      if (playing) { audioRef.current.pause(); setPlaying(false); return; }
      setPlaying(true);
      void audioRef.current.play();
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/public/voice/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: voiceNoteScript(text, { name: memberName ?? readVisitorName() }),
          hostId,
        }),
      });
      if (!res.ok) throw new Error(res.status === 429 ? "Too many voice notes — try again in a moment." : "Voice note unavailable right now.");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      urlRef.current = url;
      const audio = new Audio(url);
      audio.onended = () => setPlaying(false);
      audioRef.current = audio;
      setPlaying(true);
      await audio.play();
    } catch (e) {
      toast.error((e as Error).message);
      setPlaying(false);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (!autoPlay || played.current || !text.trim()) return;
    played.current = true;
    void play();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPlay, text]);

  return (
    <button
      type="button"
      onClick={play}
      aria-label={playing ? "Stop voice note" : "Hear this in her voice"}
      className="mt-1 inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary transition hover:bg-primary/20"
    >
      {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Volume2 className="h-3 w-3" />}
      {label ?? (playing ? "Playing…" : "Hear her voice")}
    </button>
  );
}

type RecordResult = { marker: string | null; transcript: string };

/**
 * Hold-free voice recorder: tap to record, tap to stop. Uploads to the private
 * chat bucket when signed in, and always transcribes so the creator can reply
 * to what was actually said.
 */
export function VoiceRecordButton({
  disabled,
  canUpload,
  onRecorded,
  className,
}: {
  disabled?: boolean;
  /** Signed-in users get their voice note stored + rendered in the thread. */
  canUpload?: boolean;
  onRecorded: (result: RecordResult) => void;
  className?: string;
}) {
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const recorderRef = useRef<MediaRecorder | null>(null);

  useEffect(() => {
    if (!recording) return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [recording]);

  const finish = async (blob: Blob, mime: string) => {
    setBusy(true);
    try {
      const ext = mime.includes("mp4") ? "m4a" : "webm";
      let marker: string | null = null;

      if (canUpload) {
        const { data: auth } = await supabase.auth.getUser();
        const uid = auth.user?.id;
        if (uid) {
          const path = `${uid}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-voice.${ext}`;
          const { error } = await supabase.storage
            .from(CHAT_MEDIA_BUCKET)
            .upload(path, blob, { contentType: mime, upsert: false });
          if (error) throw error;
          marker = encodeChatMedia(path, "audio");
        }
      }

      const base64 = await blobToBase64(blob);
      let transcript = "";
      try {
        const res = await fetch("/api/public/voice/transcribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ audio: base64, format: ext }),
        });
        if (res.ok) transcript = ((await res.json()) as { text?: string }).text ?? "";
      } catch { /* transcription is best-effort */ }

      if (!marker && !transcript) {
        toast.error("Couldn't hear that — try again.");
        return;
      }
      onRecorded({ marker, transcript });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
      setSeconds(0);
    }
  };

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4";
      const rec = new MediaRecorder(stream, { mimeType: mime });
      const chunks: BlobPart[] = [];
      rec.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        void finish(new Blob(chunks, { type: mime }), mime);
      };
      // One complete recording per request — no timeslice chunks.
      rec.start();
      recorderRef.current = rec;
      setRecording(true);
    } catch {
      toast.error("Mic access is blocked. Enable it in your browser settings.");
    }
  };

  const stop = () => {
    recorderRef.current?.stop();
    recorderRef.current = null;
    setRecording(false);
  };

  return (
    <button
      type="button"
      disabled={disabled || busy}
      onClick={() => (recording ? stop() : start())}
      aria-label={recording ? "Stop recording" : "Record a voice note"}
      className={
        "grid h-11 shrink-0 place-items-center rounded-2xl border transition-colors disabled:opacity-50 " +
        (recording
          ? "w-auto gap-2 border-primary bg-primary px-3 text-white"
          : "w-11 border-border bg-card text-muted-foreground hover:border-primary hover:text-primary") +
        " " + (className ?? "")
      }
    >
      {busy ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : recording ? (
        <span className="flex items-center gap-2 text-xs font-semibold">
          <Square className="h-3.5 w-3.5 fill-current" />
          {String(Math.floor(seconds / 60)).padStart(1, "0")}:{String(seconds % 60).padStart(2, "0")}
        </span>
      ) : (
        <Mic className="h-5 w-5" />
      )}
    </button>
  );
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read recording"));
    reader.onload = () => {
      const result = String(reader.result ?? "");
      resolve(result.slice(result.indexOf(",") + 1));
    };
    reader.readAsDataURL(blob);
  });
}
