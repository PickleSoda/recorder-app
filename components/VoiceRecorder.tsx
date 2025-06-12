"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAudioRecorder, RecordStatus } from "@/hooks/use-audio-recorder";
import { Button } from "./ui/button";

export function VoiceRecorder() {
  const supabase = createClient();
  const [uploadUrl, setUploadUrl] = useState<string | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const {
    startRecording,
    stopRecording,
    cancelRecording,
    status,
    blob,
  } = useAudioRecorder({
    sampleRate: 16000,
    sampleBits: 16,
    channelsCount: 1,
  });

  const handleConfirmUpload = async () => {
    if (!blob) return;
    setIsUploading(true);
    const filename = `voice-${Date.now()}.wav`;

    const { error } = await supabase.storage
      .from("voice-recordings")
      .upload(filename, blob, {
        contentType: "audio/wav",
      });

    if (error) {
      console.error("Upload failed:", error.message);
      setIsUploading(false);
      return;
    }

    const { data } = supabase.storage
      .from("voice-recordings")
      .getPublicUrl(filename);

    setUploadUrl(data.publicUrl);
    setIsPreviewing(false);
    setIsUploading(false);
  };

  const handleDiscard = () => {
    setIsPreviewing(false);
    setUploadUrl(null);
    cancelRecording?.();
  };

  const handleStop = () => {
    stopRecording();
    setIsPreviewing(true);
  };

  return (
    <div className="space-y-4">
      {!isPreviewing && (
        <Button
          onClick={
            status === RecordStatus.Recording ? handleStop : startRecording
          }
          disabled={isUploading}
        >
          {status === RecordStatus.Recording ? "Stop Recording" : "Start Recording"}
        </Button>
      )}

      {isPreviewing && blob && (
        <div className="space-y-3">
          <p className="text-sm text-gray-600">Preview your recording:</p>
          <audio controls src={URL.createObjectURL(blob)} className="w-full" />

          <div className="flex gap-2">
            <Button variant="destructive" onClick={handleDiscard} disabled={isUploading}>
              Discard
            </Button>
            <Button onClick={handleConfirmUpload} disabled={isUploading}>
              {isUploading ? "Uploading..." : "Send"}
            </Button>
          </div>
        </div>
      )}

      {uploadUrl && !isPreviewing && (
        <div>
          <p className="text-sm text-green-700">Uploaded:</p>
          <audio controls src={uploadUrl} className="w-full" />
        </div>
      )}
    </div>
  );
}
