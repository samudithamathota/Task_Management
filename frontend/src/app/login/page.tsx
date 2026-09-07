import Link from "next/link";
import { AuthForm } from "@/components/auth/AuthForm";

export default function LoginPage() {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Log in</h1>
        <AuthForm mode="login" />
        <p className="auth-switch">
          Don&apos;t have an account? <Link href="/register">Register</Link>
        </p>
      </div>
    </div>
  );
}
