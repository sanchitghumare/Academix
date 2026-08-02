"use client"
import React, { useEffect, useState, useRef } from 'react'
import { useSession, } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { fetchuser, updateProfile } from '@/actions/useractions'
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Bounce } from 'react-toastify';
import { registerForPushNotifications } from '@/lib/pushNotifications';
const Dashboard = () => {
    const { data: session } = useSession();
    const router = useRouter();
    const [form, setform] = React.useState({});
    const timeoutRef = useRef(null);
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
        const { name, value, type, checked } = e.target;

        if (name.startsWith("notifications.")) {
            const key = name.split(".")[1];
            const updatedNotifications = {
                ...form.notifications,
                [key]: type === "checkbox" ? checked : value,
            };
            setform((prev) => ({
                ...prev,
                notifications: updatedNotifications,
            }));
            clearTimeout(timeoutRef.current);

            timeoutRef.current = setTimeout(() => {
                updateNotifications(updatedNotifications);
            }, 500);
        } else {
            setform((prev) => ({
                ...prev,
                [name]: value,
            }));
        }
    };
    const handleNotificationToggle = async (enabled) => {
        if (enabled) {
            const token = await registerForPushNotifications();

            if (!token) {
                toast.error("Notification permission denied.");

                setform((prev) => ({
                    ...prev,
                    notifications: {
                        ...prev.notifications,
                        enabled: false,
                    },
                }));

                return;
            }

            await fetch("/api/notifications/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ token }),
            });
        }
        if (!enabled) {

            await fetch("/api/notifications/register", {
                method: "DELETE",
            });

        }
        const updatedNotifications = {
            ...form.notifications,
            enabled,
        };

        setform((prev) => ({
            ...prev,
            notifications: updatedNotifications,
        }));

        updateNotifications(updatedNotifications);
    };
    const updateNotifications = async (notifications) => {
        try {
            const res = await fetch("/api/user/notifications", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(notifications),
            });

            if (!res.ok) throw new Error();

            toast.success("Notification preferences updated");
        } catch {
            toast.error("Failed to update notification preferences");
        }
    };
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
                        <div className="flex flex-row justify-between items-center">
                            <h1 className="text-3xl font-bold tracking-tight text-[#FAFAFA]">Account Settings</h1>
                            <button
                                onClick={() => router.push(`/${username}`)}
                                className="rounded-lg border border-[#27272A] bg-transparent px-4 py-2 text-xs font-semibold text-[#FAFAFA] transition-colors hover:border-zinc-700 hover:bg-zinc-900/50"
                            >
                                Back to Dashboard
                            </button>
                        </div>
                        <p className="mt-2 text-sm text-[#A1A1AA]">
                            Update your profile details and preferences across Academix.
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
                {/* Notification Settings */}
                <section className="mx-auto mt-6 max-w-xl rounded-xl border border-[#27272A] bg-[#111113] p-6 shadow-xs">
                    <div className="mb-5">
                        <h2 className="text-lg font-semibold text-[#FAFAFA]">
                            Notifications
                        </h2>
                        <p className="mt-1 text-sm text-[#A1A1AA]">
                            Manage how Academix keeps you updated.
                        </p>
                    </div>

                    <div className="space-y-5">

                        {/* Master Switch */}
                        <label className="flex items-start justify-between">
                            <div>
                                <p className="font-medium text-[#FAFAFA]">
                                    Enable Notifications
                                </p>
                                <p className="mt-1 text-sm text-[#A1A1AA]">
                                    Turn all push notifications on or off.
                                </p>
                            </div>

                            <input
                                type="checkbox"
                                checked={form.notifications?.enabled ?? false}
                                onChange={(e) => handleNotificationToggle(e.target.checked)}
                                name="notifications.enabled"
                                className="h-4 w-4 accent-white"
                            />
                        </label>

                        <hr className="border-[#27272A]" />

                        {/* Attendance */}
                        <label className="flex items-start justify-between">
                            <div>
                                <p className="font-medium text-[#FAFAFA]">
                                    Attendance Alerts
                                </p>
                                <p className="mt-1 text-sm text-[#A1A1AA]">
                                    Notify me before my next absence drops me below my attendance goal.
                                </p>
                            </div>

                            <input
                                type="checkbox"
                                checked={form.notifications?.attendanceAlerts ?? true}
                                disabled={!form.notifications?.enabled}
                                onChange={handleChange}
                                name="notifications.attendanceAlerts"
                                className="h-4 w-4 accent-white"
                            />
                        </label>

                        {/* Daily Summary */}
                        <label className="flex items-start justify-between">
                            <div>
                                <p className="font-medium text-[#FAFAFA]">
                                    Daily Summary
                                </p>
                                <p className="mt-1 text-sm text-[#A1A1AA]">
                                    Receive a morning summary of today's timetable.
                                </p>
                            </div>

                            <input
                                type="checkbox"
                                checked={form.notifications?.dailySummary ?? true}
                                disabled={!form.notifications?.enabled}
                                onChange={handleChange}
                                name="notifications.dailySummary"
                                className="h-4 w-4 accent-white"
                            />
                        </label>

                        <div>
                            <label className="mb-2 block text-sm font-medium text-[#FAFAFA]">
                                Daily Summary Time
                            </label>
                            <input
                                type="time"
                                value={form.notifications?.dailySummaryTime || "08:00"}
                                disabled={
                                    !form.notifications?.enabled ||
                                    !form.notifications?.dailySummary
                                }
                                onChange={handleChange}
                                name="notifications.dailySummaryTime"
                                className="block w-full rounded-lg border border-[#27272A] bg-[#09090B] px-3 py-2 text-sm text-[#FAFAFA] outline-none focus:border-zinc-500 disabled:cursor-not-allowed disabled:opacity-50"
                            />

                        </div>

                    </div>
                </section>
            </div>
        </main>
    )
}

export default Dashboard