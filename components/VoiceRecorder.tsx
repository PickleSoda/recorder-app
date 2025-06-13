"use client";

import { useEffect, useState } from "react";
import { useVoiceVisualizer, VoiceVisualizer } from "react-voice-visualizer";
import { createClient } from "@/lib/supabase/client";
import { Button } from "./ui/button";

export function VoiceRecorder() {
  const supabase = createClient();

  const recorderControls = useVoiceVisualizer();
  const { recordedBlob, isAvailableRecordedAudio } = recorderControls;

  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadUrl, setUploadUrl] = useState<string | null>(null);

  // When recording is stopped, enable preview step
  useEffect(() => {
    if (recordedBlob && isAvailableRecordedAudio) {
      setIsPreviewing(true);
    }
  }, [recordedBlob, isAvailableRecordedAudio]);

  const handleUpload = async () => {
    if (!recordedBlob) return;

    setIsUploading(true);
    const filename = `voice-${Date.now()}.webm`;

    const { error } = await supabase.storage
      .from("voice-recordings")
      .upload(filename, recordedBlob, {
        contentType: "audio/webm",
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


  return (
    <div className="flex flex-col items-center space-y-6">
      <VoiceVisualizer
        controls={recorderControls}
        height={50}
        width="100%"
        mainBarColor="#ed1d9d" // red
        secondaryBarColor="#ed1d9d"
        barWidth={5}
        gap={1}
        speed={2}
        isDownloadAudioButtonShown={false}
        isControlPanelShown={true}
        isProgressIndicatorShown={true}
        isDefaultUIShown={false}
      />

      {isPreviewing && recordedBlob && (
        <div className="space-y-3 w-full max-w-md">
          <div className="flex justify-center gap-4">
            <Button onClick={handleUpload} disabled={isUploading} className="rounded-full p-30 bg-[#ed1d9d] text-white">
              {isUploading ? "Uploading..." : "Send"}
            </Button>
          </div>
        </div>
      )}

      {uploadUrl && !isPreviewing && (
        <div className="space-y-2 text-center">
          <p className="text-green-700">Uploaded successfully!</p>
        </div>
      )}
    </div>
  );
}
