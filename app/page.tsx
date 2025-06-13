import { ThemeSwitcher } from "@/components/theme-switcher";
import { VoiceRecorder } from "@/components/VoiceRecorder";
import Image from "next/image";
export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center">
      <ThemeSwitcher />

      <Image src="/logoo.png" alt="Logo" width={1000} height={1000} className="w-64 mb-4" />
      <div className="mt-8 w-full max-w-md">
        <VoiceRecorder />
      </div>
    </main>
  );
}
