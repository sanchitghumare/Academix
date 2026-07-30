"use client";

import React, { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";

const Navbar = () => {
  const { data: session } = useSession();
  const [showdropdown, setShowdropdown] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const userPath =
    session?.user?.username || session?.username || session?.user?.name || "dashboard";

  return (
    <nav className="sticky top-0 z-50 border-b border-[#27272A]/50 bg-[#09090B]/90 backdrop-blur-md text-[#FAFAFA]">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-6">
        {/* Brand Logo */}
        <Link className="flex items-center gap-2 text-sm font-bold tracking-tight text-[#FAFAFA]" href="/">
          <span>Academix</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-3 md:flex">
          {session ? (
            <>
              <div className="relative">
                <button
                  onClick={() => setShowdropdown(!showdropdown)}
                  id="dropdownDefaultButton"
                  className="inline-flex items-center rounded-lg border border-[#27272A] bg-[#111113] px-3 py-1.5 text-xs font-semibold text-[#FAFAFA] transition-colors hover:border-zinc-700 focus:outline-none"
                  type="button"
                >
                  Account
                  <svg
                    className="ms-2 h-2.5 w-2.5 text-[#A1A1AA]"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 10 6"
                  >
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.5"
                      d="m1 1 4 4 4-4"
                    />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                <div
                  id="dropdown"
                  className={`absolute right-0 top-10 z-30 w-40 overflow-hidden rounded-lg border border-[#27272A] bg-[#111113] p-1 shadow-lg ${
                    showdropdown ? "" : "hidden"
                  }`}
                >
                  <ul className="text-xs text-[#A1A1AA]" aria-labelledby="dropdownDefaultButton">
                    <li>
                      <Link
                        href="/dashboard"
                        onClick={() => setShowdropdown(false)}
                        className="block rounded-md px-3 py-1.5 transition-colors hover:bg-zinc-900/60 hover:text-[#FAFAFA]"
                      >
                        Account Settings
                      </Link>
                    </li>
                    <li>
                      <Link
                        href={`/${userPath}`}
                        onClick={() => setShowdropdown(false)}
                        className="block rounded-md px-3 py-1.5 transition-colors hover:bg-zinc-900/60 hover:text-[#FAFAFA]"
                      >
                        Dashboard
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>

              <button
                className="rounded-lg bg-[#FAFAFA] px-3.5 py-1.5 text-xs font-semibold text-black transition-colors hover:bg-zinc-200"
                onClick={() => {
                  signOut();
                }}
              >
                Logout
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-lg bg-[#FAFAFA] px-3.5 py-1.5 text-xs font-semibold text-black transition-colors hover:bg-zinc-200"
            >
              Login
            </Link>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="rounded-lg border border-[#27272A] bg-[#111113] px-3 py-1.5 text-xs font-semibold text-[#FAFAFA] md:hidden"
          onClick={() => setIsMenuOpen((prev) => !prev)}
          aria-label="Toggle navigation"
        >
          Menu
        </button>
      </div>

      {/* Mobile Drawer */}
      {isMenuOpen && (
        <div className="border-t border-[#27272A]/50 bg-[#09090B] px-6 py-4 md:hidden">
          {session ? (
            <div className="space-y-2">
              <Link
                href="/dashboard"
                onClick={() => setIsMenuOpen(false)}
                className="block rounded-lg border border-[#27272A] bg-[#111113] px-3 py-2 text-xs font-medium text-[#FAFAFA]"
              >
                Account Settings
              </Link>
              <Link
                href={`/${userPath}`}
                onClick={() => setIsMenuOpen(false)}
                className="block rounded-lg border border-[#27272A] bg-[#111113] px-3 py-2 text-xs font-medium text-[#FAFAFA]"
              >
                Dashboard
              </Link>
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  signOut();
                }}
                className="w-full rounded-lg bg-[#FAFAFA] px-3.5 py-2 text-xs font-semibold text-black transition-colors hover:bg-zinc-200"
              >
                Logout
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              onClick={() => setIsMenuOpen(false)}
              className="block rounded-lg bg-[#FAFAFA] px-3.5 py-2 text-center text-xs font-semibold text-black transition-colors hover:bg-zinc-200"
            >
              Login
            </Link>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;