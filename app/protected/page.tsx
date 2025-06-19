import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { RecordingsTable } from "@/components/recordings-table"; // 👈

export default async function ProtectedPage() {
  const supabase = await createClient();

  const { data: auth, error } = await supabase.auth.getUser();
  if (error || !auth?.user) {
    redirect("/auth/login");
  }

  const { data: files } = await supabase.storage
    .from("voice-recordings")
    .list("", { limit: 1000 });

  const urls =
    files
      ?.filter((f) => f.name !== ".emptyFolderPlaceholder")
      .map(async (f) => {
        const { data } = await supabase.storage
          .from("voice-recordings")
          .createSignedUrl(f.name, 60 * 10);
        const signedUrl = data?.signedUrl ?? "";
        console.log("Signed URL for", f.name, ":", signedUrl);
        return { name: f.name, url: signedUrl };
      }) || [];

  const resolvedUrls = await Promise.all(urls);

  return (
    <div className="max-w-3xl w-full mx-auto py-10 space-y-8">
      <h1 className="text-2xl font-bold">🎙️ Your Voice Recordings</h1>
      <RecordingsTable files={resolvedUrls} /> {/* ✅ this part is client-side */}
    </div>
  );
}
