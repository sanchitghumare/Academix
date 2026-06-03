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
    const image={
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
        <main className="min-h-screen bg-transparent px-4 pb-20 pt-8 text-white md:px-8">
          <div className="mx-auto max-w-5xl">
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
            
                        <section className="rounded-3xl border border-white/8 bg-[#121a2b] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.28)] md:p-8">
                                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                    <div>
                                        <p className="mb-3 inline-flex rounded-full border border-cyan-300/20 bg-cyan-400/8 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-cyan-200">Profile</p>
                                        <h1 className='text-3xl font-black tracking-tight md:text-5xl'>Welcome to your Dashboard</h1>
                                        <p className="mt-2 max-w-2xl text-sm text-slate-300 md:text-base">Update your account details from a single clean workspace.</p>
                                    </div>
                                </div>
                                <form action={handleSubmit} className="mx-auto mt-8 max-w-2xl space-y-4">
                                        <div>
                                                <label htmlFor="name" className='mb-2 block text-sm font-medium text-slate-200'>Email</label>
                                                <input className='block w-full rounded-xl border border-white/8 bg-[#0f1728] px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300' value={form.email ? form.email : ""} onChange={handleChange} type='email' name="email" id="email" />

                    </div>
                    
                    <div className='my-2'>
                        <label htmlFor="username" className="mb-2 block text-sm font-medium text-slate-200">Username</label>
                        <input value={form.username ? form.username : ""} onChange={handleChange} type="text" name='username' id="username" className="block w-full rounded-xl border border-white/8 bg-[#0f1728] px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300" />
                    </div>
                    <div className="my-2">
                        <label htmlFor="profilepic" className="mb-2 block text-sm font-medium text-slate-200">Profile Picture</label>
                        <input value={form.profilepic ? form.profilepic : ""} onChange={handleChange} type="text" name='profilepic' id="profilepic" className="block w-full rounded-xl border border-white/8 bg-[#0f1728] px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300" />
                    </div>  
                    <div className="my-6">
                        <button type="submit" className="block w-full rounded-xl bg-linear-to-br from-cyan-400 to-blue-500 px-4 py-3 text-sm font-black text-slate-950 transition hover:brightness-95">Save</button>
                    </div>
                </form>
            </section>
          </div>
        </main>
    )
}

export default Dashboard
