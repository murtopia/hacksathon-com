import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <Link href="/" className="mb-8 flex items-center gap-2">
        <span className="text-2xl font-bold tracking-tight">Hacksathon</span>
        <span className="text-sm text-muted-foreground">.com</span>
      </Link>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
