import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight">Hacksathon</span>
            <span className="text-sm text-muted-foreground">.com</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <Link href="/pricing" className="text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </Link>
            <Link href="/case-study" className="text-muted-foreground hover:text-foreground transition-colors">
              Case Study
            </Link>
            <Link href="/showcase" className="text-muted-foreground hover:text-foreground transition-colors">
              Showcase
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Log in</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="font-bold">Hacksathon.com</span>
              <span className="text-sm text-muted-foreground">A Murtopolis Venture</span>
            </div>
            <nav className="flex gap-6 text-sm text-muted-foreground">
              <Link href="/pricing" className="hover:text-foreground transition-colors">Pricing</Link>
              <Link href="/case-study" className="hover:text-foreground transition-colors">Case Study</Link>
              <Link href="/showcase" className="hover:text-foreground transition-colors">Showcase</Link>
            </nav>
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} Murtopolis, LLC
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
