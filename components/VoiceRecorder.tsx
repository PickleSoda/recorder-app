"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAudioRecorder, RecordStatus } from "@/hooks/use-audio-recorder";
import { Button } from "@/components/ui/button";

export function VoiceRecorder() {
  const supabase = createClient();
  const [uploadUrl, setUploadUrl] = useState<string | null>(null);

  const {
    startRecording,
    stopRecording,
    status,
    blob,
  } = useAudioRecorder({
    sampleRate: 16000,
    sampleBits: 16,
    channelsCount: 1,
  });

  useEffect(() => {
    const uploadAudio = async () => {
      if (!blob) return;

      const filename = `voice-${Date.now()}.wav`;

      const { error } = await supabase.storage
        .from("voice-recordings")
        .upload(filename, blob, {
          contentType: "audio/wav",
        });

      if (error) {
        console.error("Upload failed:", error.message);
        return;
      }

      const { data } = supabase.storage
        .from("voice-recordings")
        .getPublicUrl(filename);

      setUploadUrl(data.publicUrl);
    };

    uploadAudio();
  }, [blob, supabase]);

  return (
    <div className="space-y-4">
      <Button onClick={status === RecordStatus.Recording ? stopRecording : startRecording}>
        {status === RecordStatus.Recording ? "Stop Recording" : "Start Recording"}
      </Button>

      <div>Status: {RecordStatus[status ?? 0]}</div>

      {uploadUrl && (
        <audio controls src={uploadUrl} className="w-full">
          Your browser does not support the audio element.
        </audio>
      )}
    </div>
  );
}
