"use client";

import React, { useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const Login = () => {
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    document.title = "Login | Academix";

    if (session) {
      router.push(`/${session.user.name}`);
    }
  }, [session, router]);

  return (
    <div className="flex min-h-screen flex-col justify-between bg-[#09090B] font-sans text-[#FAFAFA] selection:bg-zinc-800 selection:text-white">
      {/* Navbar */}
      <nav className="mx-auto flex w-full max-w-5xl items-center justify-between border-b border-[#27272A]/50 px-6 py-6">
        <Link href="/" className="text-lg font-bold tracking-tight text-[#FAFAFA]">
          Academix
        </Link>
        <Link
          href="/"
          className="text-sm font-medium text-[#A1A1AA] transition-colors hover:text-[#FAFAFA]"
        >
          ← Back
        </Link>
      </nav>

      {/* Main Login Area */}
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-12">
        <div className="rounded-xl border border-[#27272A] bg-[#111113] p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold tracking-tight text-[#FAFAFA]">
            Welcome to Academix
          </h1>
          <p className="mt-2 text-sm text-[#A1A1AA]">
            Sign in to access your academic command center.
          </p>

          <div className="mt-8">
            <button
              onClick={() => signIn("github")}
              className="group flex w-full items-center justify-center gap-3 rounded-lg bg-[#FAFAFA] px-4 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-zinc-200"
            >
              <svg
                className="h-5 w-5 fill-current"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              <span>Continue with GitHub</span>
            </button>
          </div>

          <p className="mt-6 text-xs text-[#A1A1AA]/80">
            By continuing, you agree to organize your semester without spreadsheets.
          </p>
        </div>
      </main>

      {/* Simple Subtle Footer */}
      <footer className="mx-auto w-full max-w-5xl px-6 py-6 text-center text-xs text-[#A1A1AA]/60">
        Academix — Built for students, not spreadsheets.
      </footer>
    </div>
  );
};

export default Login;
