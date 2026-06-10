import Link from "next/link";
import { SiteFooter } from "@/components/site/site-footer";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex flex-1 flex-col items-center justify-center p-4">
        <Link href="/" className="mb-8 inline-flex items-center">
          <span className="font-serif text-2xl text-foreground">
            Hacksathon.com
          </span>
        </Link>
        <div className="w-full max-w-sm">{children}</div>
      </main>
      <SiteFooter />
    </div>
  );
}
