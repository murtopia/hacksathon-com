import { Suspense } from "react";
import { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata: Metadata = {
  title: "Sign Up",
};

export default function SignupPage() {
  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Create your account</CardTitle>
        <CardDescription>
          Start running Hacks-a-Thons at your company
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Suspense fallback={<div className="h-64" aria-hidden />}>
          <AuthForm mode="signup" />
        </Suspense>
      </CardContent>
    </Card>
  );
}
