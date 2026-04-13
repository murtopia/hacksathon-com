import { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Pricing",
};

const tiers = [
  {
    name: "Starter",
    price: "$49",
    period: "/event",
    description: "Perfect for your first hackathon",
    features: [
      "Up to 25 participants",
      "Proven playbook template",
      "IdeaLab for idea submission",
      "Blind voting and awards",
      "Reflection collection",
      "Basic analytics",
    ],
    cta: "Start Free Trial",
    highlighted: false,
  },
  {
    name: "Professional",
    price: "$149",
    period: "/event",
    description: "For teams that want the full experience",
    features: [
      "Up to 100 participants",
      "Everything in Starter",
      "AI documentation assistant",
      "Rich document editor",
      "Custom branding",
      "Advanced analytics",
      "Public showcase page",
      "Email notifications",
    ],
    cta: "Start Free Trial",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For organizations running multiple events",
    features: [
      "Unlimited participants",
      "Everything in Professional",
      "Unlimited events per year",
      "White-label branding",
      "SSO / SAML",
      "Dedicated support",
      "Custom integrations",
      "Onboarding consulting",
    ],
    cta: "Contact Us",
    highlighted: false,
  },
];

export default function PricingPage() {
  return (
    <div className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight">
            Simple, transparent pricing
          </h1>
          <p className="mt-3 text-lg text-muted-foreground max-w-xl mx-auto">
            Pay per event. No subscriptions. No hidden fees. Start with a free
            trial.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {tiers.map((tier) => (
            <Card
              key={tier.name}
              className={tier.highlighted ? "border-primary shadow-md" : ""}
            >
              <CardHeader>
                {tier.highlighted && (
                  <Badge className="w-fit mb-2">Most Popular</Badge>
                )}
                <CardTitle>{tier.name}</CardTitle>
                <CardDescription>{tier.description}</CardDescription>
                <div className="mt-2">
                  <span className="text-3xl font-bold">{tier.price}</span>
                  <span className="text-muted-foreground">{tier.period}</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2 text-sm">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">&#10003;</span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full"
                  variant={tier.highlighted ? "default" : "outline"}
                  asChild
                >
                  <Link href="/signup">{tier.cta}</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
