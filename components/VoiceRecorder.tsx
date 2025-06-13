"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils"; // optional className helper
import { Play, Pause, X } from "lucide-react";
import dynamic from "next/dynamic";

// ✅ Keep the hook imported normally (hooks must be synchronous)
import { useVoiceVisualizer } from "react-voice-visualizer";

// ✅ Dynamically import only the component
const VoiceVisualizer = dynamic(
  () => import("react-voice-visualizer").then((mod) => mod.VoiceVisualizer),
  { ssr: false }
);

import "./voice-visualizer-hide-buttons.css";

export function VoiceRecorder() {
  const supabase = createClient();

  const recorderControls = useVoiceVisualizer();

  const {
    startRecording,
    stopRecording,
    audioRef,
    recordedBlob,
    isAvailableRecordedAudio,
    clearCanvas,
    startAudioPlayback,
    stopAudioPlayback,
  } = recorderControls;

  const [step, setStep] = useState<
    "idle" | "recording" | "preview" | "uploaded"
  >("idle");
  const [uploadUrl, setUploadUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // On recording stopped and blob available, go to preview step
  useEffect(() => {
    if (recordedBlob && isAvailableRecordedAudio) {
      setStep("preview");
    }
  }, [recordedBlob, isAvailableRecordedAudio]);

  const handleClick = () => {
    if (step === "idle") {
      startRecording();
      setStep("recording");
    } else if (step === "recording") {
      stopRecording();
    } else if (step === "preview") {
      handleUpload();
    }
  };

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
    setStep("uploaded");
    setIsUploading(false);
  };

  const handleRestart = () => {
    setStep("idle");
    setUploadUrl(null);
    clearCanvas();
  };

  return (
    <div className="flex flex-col items-center space-y-6 w-full">
      <VoiceVisualizer
        controls={recorderControls}
        height={50}
        width="100%"
        mainBarColor="#ed1d9d"
        secondaryBarColor="#ed1d9d"
        barWidth={5}
        gap={1}
        speed={2}
        isDownloadAudioButtonShown={false}
        isControlPanelShown={false}
        isProgressIndicatorShown={true}
        isProgressIndicatorTimeShown={false}
        isDefaultUIShown={false}
      />

      {/* Central round action button */}
      {step !== "uploaded" && (
        <div className="relative flex items-center justify-center gap-4">
          {step === "preview" && (
            <>
              {/* Left: Play/Pause */}
              <Button
                size="icon"
                variant="ghost"
                onClick={() => {
                  if (audioRef.current?.paused) {
                    startAudioPlayback();
                  } else {
                    stopAudioPlayback();
                  }
                }}
                className="text-[#ed1d9d]"
              >
                {audioRef.current?.paused ? (
                  <Play className="w-5 h-5" />
                ) : (
                  <Pause className="w-5 h-5" />
                )}
              </Button>
            </>
          )}

          <Button
            onClick={handleClick}
            disabled={isUploading}
            className={cn(
              "rounded-full w-24 h-24 text-white text-lg font-semibold",
              "transition-colors duration-300",
              step === "idle" || step === "recording"
                ? "bg-[#ed1d9d] hover:bg-[#c51480]"
                : "bg-[#a1df3d] hover:bg-[#90c935] text-black"
            )}
          >
            {step === "idle" && "Record"}
            {step === "recording" && "Stop"}
            {step === "preview" && (isUploading ? "Uploading..." : "Send")}
          </Button>

          {step === "preview" && (
            <>
              {/* Right: Cancel */}
              <Button
                size="icon"
                variant="ghost"
                onClick={handleRestart}
                className="text-[#ed1d9d]"
              >
                <X className="w-5 h-5" />
              </Button>
            </>
          )}
        </div>
      )}

      {/* Uploaded success message */}
      {step === "uploaded" && uploadUrl && (
        <div className="text-center space-y-2">
          <Button
            onClick={handleRestart}
            className={cn(
              "rounded-full w-24 h-24 text-white text-lg font-semibold",
              "transition-colors duration-300 bg-[#ed1d9d] hover:bg-[#c51480]"
            )}
          >
            Restart
          </Button>
          <p className="text-[#a1df3d] font-medium">
            Uploaded successfully!
          </p>
        </div>
      )}
    </div>
  );
}
