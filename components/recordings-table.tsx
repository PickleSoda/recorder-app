"use client";

import { useRef, useState } from "react";
import { DownloadIcon, Play } from "lucide-react";
import JSZip from "jszip";

type RecordingFile = {
  name: string;
  url: string;
};

export function RecordingsTable({ files }: { files: RecordingFile[] }) {
  const [isDownloading, setIsDownloading] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentAudio, setCurrentAudio] = useState<string | null>(null);

  const handleDownloadAll = async () => {
    setIsDownloading(true);
    const zip = new JSZip();
    const downloadAll = files.map(async (file) => {
      const res = await fetch(file.url);
      const blob = await res.blob();
      zip.file(file.name, blob);
    });
    await Promise.all(downloadAll);
    const zipBlob = await zip.generateAsync({ type: "blob" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(zipBlob);
    a.download = "recordings.zip";
    a.click();
    setIsDownloading(false);
  };

  const handlePlay = (url: string) => {
    if (audioRef.current) {
      if (currentAudio === url) {
        audioRef.current.pause();
        setCurrentAudio(null);
      } else {
        audioRef.current.src = url;
        audioRef.current.play();
        setCurrentAudio(url);
      }
    }
  };

  return (
    <div>
      <audio ref={audioRef} hidden onEnded={() => setCurrentAudio(null)} />

      <button
        onClick={handleDownloadAll}
        className="mb-4 bg-[#ed1d9d] text-white px-4 py-2 rounded hover:bg-[#c51480]"
        disabled={isDownloading}
      >
        {isDownloading ? "Preparing ZIP..." : "Download All"}
      </button>

      <table className="w-full text-sm border">
        <thead>
          <tr className="bg-accent text-left">
            <th className="p-2">Filename</th>
            <th className="p-2 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {files.map((file) => (
            <tr key={file.name} className="border-t">
              <td className="p-2">{file.name}</td>
              <td className="p-2 text-right flex justify-end gap-4">
                <button
                  onClick={() => handlePlay(file.url)}
                  className="inline-flex items-center gap-1 text-pink-600 hover:underline"
                >
                  <Play size={14} />
                  {currentAudio === file.url ? "Pause" : "Play"}
                </button>
                <a
                  href={file.url}
                  download
                  className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                >
                  <DownloadIcon size={14} />
                  Download
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
