"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password");
      } else {
        router.push("/admin");
        router.refresh();
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--black)] flex items-center justify-center p-4">
      <Card variant="bordered" className="w-full max-w-md p-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <Image
            src="/logo-icon.png"
            alt="Basktball"
            width={60}
            height={60}
            className="mx-auto mb-4"
          />
          <h1 className="font-[family-name:var(--font-anton)] text-2xl tracking-wider text-white">
            ADMIN LOGIN
          </h1>
          <p className="text-sm text-white/50 mt-2">
            Sign in to access the admin dashboard
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 p-3 mb-6 text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-white/60 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-[var(--black)] border-2 border-[var(--border)] text-white px-4 py-3 focus:border-[var(--orange)] outline-none"
              placeholder="admin@basktball.com"
            />
          </div>

          <div>
            <label className="block text-sm text-white/60 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-[var(--black)] border-2 border-[var(--border)] text-white px-4 py-3 focus:border-[var(--orange)] outline-none"
              placeholder="••••••••"
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full mt-6"
            isLoading={isLoading}
            disabled={isLoading}
          >
            SIGN IN
          </Button>
        </form>

        {/* Demo Credentials */}
        <div className="mt-8 pt-6 border-t border-white/10 text-center">
          <p className="text-xs text-white/40 mb-2">Demo Credentials:</p>
          <p className="text-xs text-white/60">
            Email: admin@basktball.com
            <br />
            Password: admin123
          </p>
        </div>
      </Card>
    </div>
  );
}
