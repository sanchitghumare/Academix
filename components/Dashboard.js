"use client"
import React, { useEffect, useState } from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { fetchuser, updateProfile } from '@/actions/useractions'
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Bounce } from 'react-toastify';

const Dashboard = () => {
    const { data: session } = useSession();
    const router = useRouter();
    const [form, setform] = React.useState({});
    useEffect(() => {
        console.log(session)
        if (!session) {
            router.push("/login")
        } else {
            getdata();
        }
    }, [])
    const image = {
        profilepic: session?.user?.image
    }
    const getdata = async () => {
        let u = await fetchuser(session.user.name);
        setform(u);
    }
    const handleChange = (e) => {
        setform({ ...form, [e.target.name]: e.target.value })
    }
    const handleSubmit = async (e) => {
        let a = await updateProfile(e, session.user.name)
        toast('Profile Updated', {
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            theme: "light",
            transition: Bounce,
        })
    }
    return (
        <main className="min-h-screen bg-[#09090B] font-sans text-[#FAFAFA] selection:bg-zinc-800 selection:text-white">
            <div className="mx-auto max-w-5xl px-6 py-12">
                <ToastContainer
                    position="top-right"
                    autoClose={5000}
                    hideProgressBar={false}
                    newestOnTop={false}
                    closeOnClick
                    rtl={false}
                    pauseOnFocusLoss
                    draggable
                    pauseOnHover
                    theme="dark"
                />

                {/* Header Section */}
                <section className="mb-8">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-[#FAFAFA]">Account Settings</h1>
                        <p className="mt-2 text-sm text-[#A1A1AA]">
                            Update your profile details and preferences across Stratos.
                        </p>
                    </div>
                </section>

                <div className="mb-8">
                    <hr className="border-[#27272A]" />
                </div>

                {/* Profile Form Card */}
                <section className="mx-auto max-w-xl rounded-xl border border-[#27272A] bg-[#111113] p-6 shadow-xs">
                    <form action={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="email" className="mb-1.5 block text-xs font-semibold text-[#FAFAFA]">
                                Email Address
                            </label>
                            <input
                                className="block w-full rounded-lg border border-[#27272A] bg-[#09090B] px-3.5 py-2 text-sm text-[#FAFAFA] placeholder-[#A1A1AA]/50 outline-none transition-colors focus:border-zinc-500"
                                value={form.email ? form.email : ""}
                                onChange={handleChange}
                                type="email"
                                name="email"
                                id="email"
                                placeholder="name@example.com"
                            />
                        </div>

                        <div>
                            <label htmlFor="username" className="mb-1.5 block text-xs font-semibold text-[#FAFAFA]">
                                Username
                            </label>
                            <input
                                value={form.username ? form.username : ""}
                                onChange={handleChange}
                                type="text"
                                name="username"
                                id="username"
                                className="block w-full rounded-lg border border-[#27272A] bg-[#09090B] px-3.5 py-2 text-sm text-[#FAFAFA] placeholder-[#A1A1AA]/50 outline-none transition-colors focus:border-zinc-500"
                                placeholder="username"
                            />
                        </div>

                        <div>
                            <label htmlFor="profilepic" className="mb-1.5 block text-xs font-semibold text-[#FAFAFA]">
                                Profile Picture URL
                            </label>
                            <input
                                value={form.profilepic ? form.profilepic : ""}
                                onChange={handleChange}
                                type="text"
                                name="profilepic"
                                id="profilepic"
                                className="block w-full rounded-lg border border-[#27272A] bg-[#09090B] px-3.5 py-2 text-sm text-[#FAFAFA] placeholder-[#A1A1AA]/50 outline-none transition-colors focus:border-zinc-500"
                                placeholder="https://example.com/avatar.png"
                            />
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                className="block w-full rounded-lg bg-[#FAFAFA] px-4 py-2.5 text-xs font-semibold text-black transition-colors hover:bg-zinc-200"
                            >
                                Save Changes
                            </button>
                        </div>
                    </form>
                </section>
            </div>
        </main>
    )
}

export default Dashboard