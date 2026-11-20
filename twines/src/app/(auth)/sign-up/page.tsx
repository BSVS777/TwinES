import type { Metadata } from "next";
import { SignUpForm } from "@/components/forms/sign-up-form";

export const metadata: Metadata = { title: "Create account | TwinES" };

export default function SignUpPage() {
  return (
    <>
      <h1>Create your account</h1>
      <SignUpForm />
    </>
  );
}
