import Link from "next/link";
import { APP_NAME } from "@/lib/app-info";

export default function Home() {
  return (
    <main style={{ padding: "2rem" }}>
      <h1>{APP_NAME}</h1>
      <p>Track the health of your vehicle parts and plan upcoming maintenance.</p>
      <p>
        <Link href="/sign-in">Sign in</Link> or <Link href="/sign-up">create an account</Link>.
      </p>
    </main>
  );
}
