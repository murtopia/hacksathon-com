import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Showcase",
};

export default function ShowcasePage() {
  return (
    <div className="py-20">
      <div className="container mx-auto px-4 text-center">
        <h1 className="text-4xl font-bold tracking-tight">Showcase</h1>
        <p className="mt-3 text-lg text-muted-foreground max-w-xl mx-auto">
          See what teams have built with Hacksathon.com. Real projects from real
          hackathons.
        </p>
        <div className="mt-12 rounded-lg border border-dashed p-12">
          <p className="text-sm text-muted-foreground">
            Public showcase gallery coming soon. Companies can opt-in to display
            their hackathon projects and outcomes here.
          </p>
        </div>
      </div>
    </div>
  );
}
