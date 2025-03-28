"use client";

import { useActionState, useState, useEffect } from "react";
import Image from "next/image";
import { TextInput } from "@/app/client/components/TextInput";
import { getSessionToken } from "@/app/server/actions/getSession";

export function LoginForm({ className, returnTo = "/" }: { className?: string; returnTo?: string }) {
  const [formState, login] = useActionState(getSessionToken, null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (formState?.sessionToken) {
      window.location.href = returnTo;
    }
  }, [formState, returnTo]);

  return (
    <section className={className}>
      {formState?.message && (
        <section className="border border-red-700 bg-red-200 text-red-900 px-4 py-3 rounded-lg min-w-72 mb-4">
          {formState.message}
        </section>
      )}
      <form action={login}>
        <div className="flex flex-col mb-6 gap-4">
          <label>
            Email
            <div className="w-full max-w-sm min-w-[200px]">
              <TextInput
                placeholder="Type here..."
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </label>
          <label>
            Password
            <TextInput
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
        </div>
        <button
          className="rounded-full w-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5"
          type="submit"
        >
          <Image className="dark:invert" src="/vercel.svg" alt="Vercel logomark" width={20} height={20} />
          Connect
        </button>
      </form>
    </section>
  );
}
