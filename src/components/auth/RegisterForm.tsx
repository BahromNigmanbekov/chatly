"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { UsernameField } from "@/components/auth/UsernameField";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { registerUser } from "@/lib/firebase/auth";
import { friendlyErrorMessage } from "@/lib/utils/firebaseError";
import { isValidUsername } from "@/lib/utils/username";

export function RegisterForm() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit =
    displayName.trim().length > 0 &&
    isValidUsername(username) &&
    email.trim().length > 0 &&
    password.length >= 6 &&
    !submitting;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      await registerUser({ email, password, displayName, username });
      router.push("/");
    } catch (err) {
      setError(friendlyErrorMessage(err));
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-4">
      <Input
        label="Ism-familiya"
        name="displayName"
        autoComplete="name"
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
        placeholder="Aziza Karimova"
        required
      />
      <UsernameField value={username} onChange={setUsername} />
      <Input
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="siz@misol.com"
        required
      />
      <Input
        label="Parol"
        name="password"
        type="password"
        autoComplete="new-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Kamida 6 ta belgi"
        required
      />
      {error && <p className="text-sm text-danger">{error}</p>}
      <Button type="submit" size="lg" disabled={!canSubmit} className="mt-2 w-full">
        {submitting ? "Ro'yxatdan o'tilmoqda..." : "Ro'yxatdan o'tish"}
      </Button>
      <p className="text-center text-sm text-text-muted">
        Hisobingiz bormi?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Kirish
        </Link>
      </p>
    </form>
  );
}
