import { ThemeSwitcher } from "@/components/theme-switcher";
import { VoiceRecorder } from "@/components/VoiceRecorder";
export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center">
      
          <ThemeSwitcher />
      <h1 className="text-3xl font-bold mt-8">Welcome to the Voice Recorder App</h1>
      <p className="text-lg mt-4">Record your voice and upload it to the cloud.</p>
      <div className="mt-8 w-full max-w-md">
        <VoiceRecorder />
      </div>
    </main>
  );
}
