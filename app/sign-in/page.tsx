import type { Metadata } from "next";
import SignIn from "@/components/sign-in";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to Kernbau, or open an account.",
  robots: { index: false, follow: false },
};

export default function SignInPage() {
  return <SignIn />;
}
