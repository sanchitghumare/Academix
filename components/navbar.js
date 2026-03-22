"use client"
import React from "react";
import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
const navbar = () => {
  const { data: session } = useSession();
  const [showdropdown, setShowdropdown] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  return (
    <nav className='sticky top-0 z-50 border-b border-white/10 bg-gray-900/95 text-white backdrop-blur-md'>
      <div className='mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4'>
      <Link className='logo flex items-center justify-center text-sm font-bold md:text-lg' href="/">
        <img className="invert" width={28} height={28} src="../available.png" alt="Stratos" />
        <span className="text-white ">Stratos</span>
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
            className="inline-flex items-center rounded-lg bg-blue-700 px-3 py-2.5 text-sm font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300"
            type="button"
          >
            Account
            <svg className="ms-3 h-2.5 w-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4" />
            </svg>
          </button>

          <div id="dropdown" className={`absolute right-0 top-12 z-30 w-44 divide-y divide-gray-100 rounded-lg bg-white shadow ${showdropdown ? "" : "hidden"}`}>
            <ul className="py-2 text-sm text-gray-700" aria-labelledby="dropdownDefaultButton">
              <li>
                <Link href="/dashboard" className="block px-4 py-2 hover:bg-gray-100">Dashboard</Link>
              </li>
              <li>
                <Link href={`/${session.user.name}`} className="block px-4 py-2 hover:bg-gray-100">Your Page</Link>
              </li>
            </ul>
          </div>
          </div>

          <button className='w-fit rounded-lg bg-linear-to-br from-purple-600 to-blue-500 px-5 py-2.5 text-center text-sm font-medium text-white focus:outline-none focus:ring-4 focus:ring-blue-300 hover:bg-linear-to-bl' onClick={() => { signOut() }}>Logout</button>
          </>
        ) : (
          <Link href="/login" className='w-fit rounded-lg bg-linear-to-br from-purple-600 to-blue-500 px-5 py-2.5 text-center text-sm font-medium text-white focus:outline-none focus:ring-4 focus:ring-blue-300 hover:bg-linear-to-bl'>Login</Link>
        )}
      </div>

      <button
        className='rounded-lg border border-white/20 px-3 py-2 text-xs font-semibold text-white md:hidden'
        onClick={() => setIsMenuOpen((prev) => !prev)}
        aria-label="Toggle navigation"
      >
        Menu
      </button>
      </div>

      {isMenuOpen && (
        <div className='border-t border-white/10 bg-slate-900 px-4 py-3 md:hidden'>
          {session ? (
            <div className='space-y-2'>
              <Link
                href="/dashboard"
                onClick={() => setIsMenuOpen(false)}
                className='block rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm'
              >
                Dashboard
              </Link>
              <Link
                href={`/${session.user.name}`}
                onClick={() => setIsMenuOpen(false)}
                className='block rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm'
              >
                Your Page
              </Link>
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  signOut();
                }}
                className='w-full rounded-lg bg-linear-to-br from-purple-600 to-blue-500 px-4 py-2 text-sm font-medium text-white'
              >
                Logout
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              onClick={() => setIsMenuOpen(false)}
              className='block rounded-lg bg-linear-to-br from-purple-600 to-blue-500 px-4 py-2 text-center text-sm font-medium text-white'
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