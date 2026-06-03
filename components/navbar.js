"use client"
import React from "react";
import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
const navbar = () => {
  const { data: session } = useSession();
  const [showdropdown, setShowdropdown] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const userPath = session?.user?.username || session?.username || session?.user?.name || "dashboard";
  
  return (
    <nav className='sticky top-0 z-50 border-b border-white/8 bg-[#0f1728]/95 text-white shadow-[0_10px_30px_rgba(0,0,0,0.22)]'>
      <div className='mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4'>
      <Link className='logo flex items-center justify-center gap-3 text-sm font-bold md:text-lg' href="/">
        <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-linear-to-br from-cyan-400 to-blue-500 text-slate-950 shadow-[0_12px_30px_rgba(79,209,255,0.25)]">S</span>
        <span className="text-white">Stratos</span>
      </Link>

      <div className='hidden items-center gap-3 md:flex'>
        {session ? (
          <>
          <div className="relative">
          <button
            onClick={() => setShowdropdown(!showdropdown)}
            onBlur={() => {
              setTimeout(() => {
                setShowdropdown(false);
              }, 100);
            }}
            id="dropdownDefaultButton"
            data-dropdown-toggle="dropdown"
            className="inline-flex items-center rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm font-semibold text-white transition hover:border-cyan-300/30 hover:bg-white/10 focus:outline-none"
            type="button"
          >
            Account
            <svg className="ms-3 h-2.5 w-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4" />
            </svg>
          </button>

          <div id="dropdown" className={`absolute right-0 top-12 z-30 w-48 overflow-hidden rounded-2xl border border-white/10 bg-[#121a2b] shadow-2xl ${showdropdown ? "" : "hidden"}`}>
            <ul className="py-2 text-sm text-slate-200" aria-labelledby="dropdownDefaultButton">
              <li>
                <Link href="/dashboard" className="block px-4 py-2 transition hover:bg-white/5">Dashboard</Link>
              </li>
              <li>
                <Link href={`/${userPath}`} className="block px-4 py-2 transition hover:bg-white/5">Your Page</Link>
              </li>
            </ul>
          </div>
          </div>

          <button className='w-fit rounded-xl bg-linear-to-br from-cyan-400 to-blue-500 px-5 py-2.5 text-center text-sm font-bold text-slate-950 transition hover:brightness-95' onClick={() => { signOut() }}>Logout</button>
          </>
        ) : (
          <Link href="/login" className='w-fit rounded-xl bg-linear-to-br from-cyan-400 to-blue-500 px-5 py-2.5 text-center text-sm font-bold text-slate-950 transition hover:brightness-95'>Login</Link>
        )}
      </div>

      <button
        className='rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white md:hidden'
        onClick={() => setIsMenuOpen((prev) => !prev)}
        aria-label="Toggle navigation"
      >
        Menu
      </button>
      </div>

      {isMenuOpen && (
        <div className='border-t border-white/10 bg-[#0f1728] px-4 py-3 md:hidden'>
          {session ? (
            <div className='space-y-2'>
              <Link
                href="/dashboard"
                onClick={() => setIsMenuOpen(false)}
                className='block rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm'
              >
                Dashboard
              </Link>
              <Link
                href={`/${userPath}`}
                onClick={() => setIsMenuOpen(false)}
                className='block rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm'
              >
                Your Page
              </Link>
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  signOut();
                }}
                className='w-full rounded-xl bg-linear-to-br from-cyan-400 to-blue-500 px-4 py-2 text-sm font-bold text-slate-950'
              >
                Logout
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              onClick={() => setIsMenuOpen(false)}
              className='block rounded-xl bg-linear-to-br from-cyan-400 to-blue-500 px-4 py-2 text-center text-sm font-bold text-slate-950'
            >
              Login
            </Link>
          )}
        </div>
      )}
    </nav>
  )
}

export default navbar