/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

export const dynamic = "force-dynamic";

import { ThemeSwitcher } from "@/components/theme-switcher";
import { VoiceRecorder } from "@/components/VoiceRecorder";
import Image from "next/image";

import { useRef } from "react";
import { Maximize2 } from "lucide-react"; // optional icon

export default function Home() {
  const mainRef = useRef<HTMLElement>(null);

  const enterFullscreen = () => {
    const el = mainRef.current;
    if (el?.requestFullscreen) el.requestFullscreen();
    else if ((el as any)?.webkitRequestFullscreen) (el as any).webkitRequestFullscreen();
    else if ((el as any)?.msRequestFullscreen) (el as any).msRequestFullscreen();
  };

  const exitFullscreen = () => {
    if (document.exitFullscreen) document.exitFullscreen();
    else if ((document as any).webkitExitFullscreen) (document as any).webkitExitFullscreen();
    else if ((document as any).msExitFullscreen) (document as any).msExitFullscreen();
  }

  return (
    <main
      ref={mainRef}
      className="min-h-screen flex flex-col items-center bg-white dark:bg-black text-black dark:text-white"
    >
      <div className="w-full flex justify-end p-2">
      <ThemeSwitcher />

        <button
          onClick={ () => {
            if (document.fullscreenElement) {
              exitFullscreen();
            }
            else {
              enterFullscreen();
            }
          }
        }
          className="flex items-center gap-2 px-3 py-1 border rounded text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      <Image
        src="/logoo.png"
        alt="Logo"
        width={1000}
        height={1000}
        className="w-full max-w-md"
      />
        <div className="w-full max-w-md">
        <VoiceRecorder />
      </div>
    </main>
  );
}

