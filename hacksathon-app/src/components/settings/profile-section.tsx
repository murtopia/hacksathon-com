"use client";

import {
  useRef,
  useState,
  useTransition,
  type DragEvent,
} from "react";
import { useRouter } from "next/navigation";
import { Loader2, UploadCloud, X } from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserAvatar } from "@/components/ui/user-avatar";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const BUCKET = "avatars";
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB
const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp"];

interface ProfileSectionProps {
  userId: string;
  fullName: string | null;
  email: string;
  avatarUrl: string | null;
}

/**
 * Your profile card on /settings. Today the only editable field is the
 * avatar - the rest of the row (name, email) is shown for context.
 *
 * Upload flow: client → Supabase Storage at `{userId}/{uuid}.{ext}` →
 * PATCH /api/profile with the resulting public URL. No crop tool here
 * (a circular avatar doesn't need focal-point control, and the upload
 * pattern is intentionally simpler than the idea-screenshot uploader).
 */
export function ProfileSection({
  userId,
  fullName,
  email,
  avatarUrl,
}: ProfileSectionProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [removing, startRemove] = useTransition();
  const [dragOver, setDragOver] = useState(false);
  const [name, setName] = useState(fullName ?? "");
  const [savingName, startSaveName] = useTransition();

  const trimmedName = name.trim();
  const initialName = (fullName ?? "").trim();
  const nameDirty = trimmedName.length > 0 && trimmedName !== initialName;

  function handleSaveName(e: React.FormEvent) {
    e.preventDefault();
    if (!nameDirty || savingName) return;
    startSaveName(async () => {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: trimmedName }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        toast.error(body?.error ?? "Couldn't save your name.");
        return;
      }
      toast.success("Name updated.");
      router.refresh();
    });
  }

  async function handleFile(file: File) {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error("Unsupported image type", {
        description: "Use a PNG, JPEG, or WebP file.",
      });
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error("File too large", {
        description: "Avatars must be 2 MB or smaller.",
      });
      return;
    }

    setUploading(true);
    try {
      const supabase = createClient();
      const ext =
        file.name.split(".").pop()?.toLowerCase() ||
        file.type.split("/")[1] ||
        "png";
      const path = `${userId}/${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type,
        });
      if (uploadError) {
        toast.error("Upload failed", { description: uploadError.message });
        return;
      }

      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);

      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar_url: data.publicUrl }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        toast.error(body?.error ?? "Couldn't save your avatar.");
        return;
      }

      toast.success("Avatar updated.");
      router.refresh();
    } catch (err) {
      console.error("[ProfileSection] upload failed", err);
      toast.error("Upload failed", {
        description: err instanceof Error ? err.message : "Try again?",
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function handleRemove() {
    if (!avatarUrl) return;
    startRemove(async () => {
      const res = await fetch("/api/profile", { method: "DELETE" });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        toast.error(body?.error ?? "Couldn't remove your avatar.");
        return;
      }
      toast.success("Avatar removed.");
      router.refresh();
    });
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void handleFile(file);
  }

  const busy = uploading || removing;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Your profile</CardTitle>
        <CardDescription>
          A small avatar shown on IdeaLab cards, in your team&apos;s page,
          and in the top header. Square images work best; we&apos;ll crop
          them to a circle.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <UserAvatar
            name={fullName}
            email={email}
            avatarUrl={avatarUrl}
            size="lg"
          />
          <div className="flex-1 space-y-4">
            <form
              onSubmit={handleSaveName}
              className="space-y-2"
              aria-label="Update your name"
            >
              <Label htmlFor="full-name">Full name</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="full-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Smith"
                  maxLength={120}
                  autoComplete="name"
                  disabled={savingName}
                  className="flex-1"
                />
                <Button
                  type="submit"
                  variant="outline"
                  disabled={!nameDirty || savingName}
                >
                  {savingName ? (
                    <>
                      <Loader2
                        className="mr-2 h-4 w-4 animate-spin"
                        aria-hidden="true"
                      />
                      Saving…
                    </>
                  ) : (
                    "Save"
                  )}
                </Button>
              </div>
              <p className="font-mono text-xs uppercase tracking-wide text-[var(--text-tertiary)]">
                {email}
              </p>
            </form>

            <div
              role="button"
              tabIndex={0}
              aria-label="Upload an avatar"
              aria-disabled={busy}
              onClick={() => {
                if (!busy) fileInputRef.current?.click();
              }}
              onKeyDown={(e) => {
                if ((e.key === "Enter" || e.key === " ") && !busy) {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              onDragOver={(e) => {
                e.preventDefault();
                if (!busy) setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                if (busy) return;
                handleDrop(e);
              }}
              className={cn(
                "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed bg-muted/30 px-6 py-6 text-center transition-colors",
                dragOver && "border-foreground/60 bg-muted/60",
                busy && "cursor-not-allowed opacity-60",
              )}
            >
              {uploading ? (
                <>
                  <Loader2
                    className="h-6 w-6 animate-spin text-muted-foreground"
                    aria-hidden="true"
                  />
                  <p className="text-sm font-medium">Uploading…</p>
                </>
              ) : (
                <>
                  <UploadCloud
                    className="h-6 w-6 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <div>
                    <p className="text-sm font-medium">
                      Drop an image here or click to browse
                    </p>
                    <p className="form-hint mt-1">
                      PNG, JPEG, or WebP - max 2 MB
                    </p>
                  </div>
                </>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={busy}
              >
                {uploading ? (
                  <>
                    <Loader2
                      className="mr-2 h-4 w-4 animate-spin"
                      aria-hidden="true"
                    />
                    Uploading…
                  </>
                ) : (
                  "Choose file"
                )}
              </Button>
              {avatarUrl && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleRemove}
                  disabled={busy}
                >
                  {removing ? (
                    <>
                      <Loader2
                        className="mr-2 h-4 w-4 animate-spin"
                        aria-hidden="true"
                      />
                      Removing…
                    </>
                  ) : (
                    <>
                      <X className="mr-2 h-4 w-4" aria-hidden="true" />
                      Remove
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(",")}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
          }}
          disabled={busy}
          className="hidden"
        />
      </CardContent>
    </Card>
  );
}
