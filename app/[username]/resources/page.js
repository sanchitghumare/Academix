
"use client";

import React, { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";

const categories = ["Notes", "PYQs", "Reference", "Others"];
const formatDate = (dateString) => {
    const options = { year: "numeric", month: "short", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

const isPdfResource = (item) => {
    const type = String(item?.fileType || "").toLowerCase();
    const url = String(item?.fileUrl || "").toLowerCase();
    const title = String(item?.title || "").toLowerCase();
    return type.includes("pdf") || url.endsWith(".pdf") || title.endsWith(".pdf");
};

const getOpenUrl = (item) => {
    if (!item?._id) return "#";
    return `/api/resources/open?id=${item._id}`;
};

const page = ({ params }) => {
    const resolvedusername = use(params);
    const { username } = resolvedusername || {};
    const { data: session } = useSession();

    const [resources, setResources] = useState([]);
    const [filter, setFilter] = useState("All");
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [form, setForm] = useState({
        title: "",
        subject: "",
        category: "Notes",
        file: null,
    });

    // 🤖 AI Chat Integration UI States
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [inputQuestion, setInputQuestion] = useState("");
    const [selectedResource, setSelectedResource] = useState(null);

    const filteredResources = useMemo(() => {
        if (filter === "All") return resources;
        return resources.filter((item) => item.category === filter);
    }, [filter, resources]);

    useEffect(() => {
        const fetchresources = async () => {
            setIsLoading(true);
            try {
                const response = await fetch(`/api/resources?username=${username}`);
                const data = await response.json();
                setResources(data.resources || []);
            } catch (error) {
                console.error("Error fetching resources:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchresources();
    }, [username]);

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!form.title || !form.subject || !form.file) {
            alert("Please fill all fields and select a file");
            return;
        }

        console.log("Uploading file:", {
            name: form.file?.name,
            size: form.file?.size,
            type: form.file?.type,
        });

        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append("title", form.title);
            formData.append("subject", form.subject);
            formData.append("category", form.category);
            formData.append("file", form.file, form.file.name || "resource");
            const response = await fetch("/api/resources", {
                method: "POST",
                body: formData,
            });
            const data = await response.json();
            if (!data?.success) {
                alert(data?.error || "Failed to upload resource");
                return;
            }

            setForm({ title: "", subject: "", category: "Notes", file: null });
            const refreshed = await fetch(`/api/resources?username=${username}`);
            const refreshedData = await refreshed.json();
            setResources(refreshedData?.resources || []);
        } catch (error) {
            console.error("Error uploading resource:", error);
            alert("Upload failed. Please try again.");
        } finally {
            setIsUploading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this resource?")) {
            return;
        }
        try {
            const response = await fetch(`/api/resources?id=${id}`, {
                method: "DELETE",
            });
            const data = await response.json();
        } catch (error) {
            console.error("Error deleting resource:", error);
        } finally {
            if (selectedResource?._id === id) {
                setSelectedResource(null);
                setMessages([]);
            }
            setResources((prev) => prev.filter((item) => item._id !== id));
        }
    }

    const askAIAboutResource = async (e) => {
        e.preventDefault();
        if (!inputQuestion.trim() || !selectedResource) return;

        const currentQuestion = inputQuestion;
        const activeFileName = selectedResource.fileName || selectedResource.title;

        setInputQuestion(""); 
        setMessages(prev => [...prev, { role: "user", text: currentQuestion }]);
        setLoading(true);

        try {
            const res = await fetch("/api/resources/query", { 
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ filename: activeFileName, question: currentQuestion }),
            });
            
            const data = await res.json();
            setMessages(prev => [...prev, { role: "ai", text: data.answer || data.error || "No response received." }]);
        } catch (err) {
            console.error("Frontend chat crash:", err);
            setMessages(prev => [...prev, { role: "ai", text: "Error connecting to local AI engine." }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-slate-950 px-4 py-10 text-white md:px-8">
            <div className="mx-auto max-w-7xl">
                {/* Header Metrics Section */}
                <section className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl md:p-8">
                    <p className="mb-3 inline-flex rounded-full border border-cyan-300/30 bg-cyan-400/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-cyan-200">
                        Shared Study Hub
                    </p>
                    <h1 className="text-3xl font-black tracking-tight md:text-5xl">Resources</h1>
                    <p className="mt-3 max-w-2xl text-sm text-slate-300 md:text-base">
                        Upload notes, PYQs and reference files for quick access across your semester.
                    </p>

                    <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                            <p className="text-xs uppercase tracking-wider text-slate-400">Total Files</p>
                            <p className="mt-2 text-2xl font-extrabold">{resources.length}</p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                            <p className="text-xs uppercase tracking-wider text-slate-400">Filtered</p>
                            <p className="mt-2 text-2xl font-extrabold">{filteredResources.length}</p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                            <p className="text-xs uppercase tracking-wider text-slate-400">Category</p>
                            <p className="mt-2 text-2xl font-extrabold text-cyan-300">{filter}</p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                            <p className="text-xs uppercase tracking-wider text-slate-400">User</p>
                            <p className="mt-2 truncate text-2xl font-extrabold text-emerald-300">{username}</p>
                        </div>
                    </div>
                </section>

                {/* Main Action Workspaces */}
                <section className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_1.9fr]">
                    
                    {/* Left Column Stack: Upload Input + AI Chat Box */}
                    <div className="space-y-6">
                        {/* 1. Upload Component Form */}
                        <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-5">
                            <h2 className="text-xl font-black">Upload Resource</h2>
                            <p className="mt-1 text-sm text-slate-300">Add title, subject, category and file.</p>

                            <form onSubmit={(e) => handleUpload(e)} className="mt-5 space-y-3">
                                <input
                                    type="text"
                                    value={form.title}
                                    onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value || "" }))}
                                    placeholder="Title (e.g. Unit 3 Notes)"
                                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm outline-none transition focus:border-cyan-300 text-white"
                                />
                                <input
                                    type="text"
                                    value={form.subject}
                                    onChange={(e) => setForm((prev) => ({ ...prev, subject: e.target.value }))}
                                    placeholder="Subject (e.g. DBMS)"
                                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm outline-none transition focus:border-cyan-300 text-white"
                                />
                                <select
                                    value={form.category}
                                    onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm outline-none transition focus:border-cyan-300 text-white"
                                >
                                    {categories.map((item) => (
                                        <option key={item} value={item}>{item}</option>
                                    ))}
                                </select>
                                <input
                                    type="file"
                                    onChange={(e) => {
                                        const selectedFile = e.target.files?.[0] || null;
                                        setForm((prev) => ({ ...prev, file: selectedFile }));
                                    }}
                                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-cyan-400 file:px-3 file:py-2 file:font-semibold file:text-slate-950 text-white"
                                />
                                <button
                                    type="submit"
                                    disabled={isUploading}
                                    className="w-full rounded-xl bg-cyan-400 px-4 py-2.5 text-sm font-black text-slate-950 transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-70"
                                >
                                    {isUploading ? "Uploading..." : "Upload"}
                                </button>
                            </form>
                        </div>

                        {/* 2. Interactive AI Chat Assistant Box */}
                        <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-5 flex flex-col h-105">
                            <div className="border-b border-white/10 pb-3">
                                <h2 className="text-xl font-black text-cyan-300">Stratos AI Study Chat</h2>
                                <p className="text-xs text-slate-400 mt-0.5 truncate">
                                    {selectedResource ? `Active Context: ${selectedResource.title}` : "Select a document card to talk with AI"}
                                </p>
                            </div>

                            {/* Chat Context History Box */}
                            <div className="flex-1 overflow-y-auto space-y-3 py-4 pr-1 text-sm scrollbar-thin">
                                {messages.length === 0 ? (
                                    <div className="h-full flex items-center justify-center text-center text-slate-500 px-4 text-xs">
                                        {selectedResource 
                                            ? "Ask anything! The local model has access to this transcript's vector chunks."
                                            : "Click a resource card's text block on the right to lock it into the AI context window."}
                                    </div>
                                ) : (
                                    messages.map((msg, idx) => (
                                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                                                msg.role === 'user' ? 'bg-cyan-500 text-slate-950 font-medium' : 'bg-slate-800 text-slate-100 border border-white/5'
                                            }`}>
                                                {msg.text}
                                            </div>
                                        </div>
                                    ))
                                )}
                                {loading && (
                                    <div className="text-[10px] text-cyan-400/70 animate-pulse tracking-wide font-mono">
                                        Stratos AI running local inference math loops...
                                    </div>
                                )}
                            </div>

                            {/* Input submission box */}
                            <form onSubmit={askAIAboutResource} className="flex gap-2 pt-2 border-t border-white/10">
                                <input
                                    type="text"
                                    placeholder={selectedResource ? "Query this document..." : "Lock a file context to begin"}
                                    disabled={!selectedResource || loading}
                                    value={inputQuestion}
                                    onChange={(e) => setInputQuestion(e.target.value)}
                                    className="flex-1 bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs outline-none focus:border-cyan-300 disabled:opacity-40 transition"
                                />
                                <button 
                                    type="submit" 
                                    disabled={loading || !selectedResource || !inputQuestion.trim()}
                                    className="bg-cyan-400 hover:brightness-95 text-slate-950 font-bold rounded-xl px-4 py-2 text-xs disabled:opacity-40 transition-all"
                                >
                                    Ask
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Right Column Layout: Display Resources Grid List */}
                    <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-5">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <h2 className="text-xl font-black">All Resources</h2>
                            <select
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                                className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm outline-none transition focus:border-cyan-300"
                            >
                                <option value="All">All</option>
                                {categories.map((item) => (
                                    <option key={item} value={item}>{item}</option>
                                ))}
                            </select>
                        </div>

                        {isLoading ? (
                            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6 text-center text-sm text-slate-300">
                                Loading resources...
                            </div>
                        ) : filteredResources.length === 0 ? (
                            <div className="mt-6 rounded-2xl border border-dashed border-white/20 bg-white/5 p-8 text-center">
                                <p className="text-base font-semibold">No resources found</p>
                                <p className="mt-1 text-sm text-slate-300">Upload your first file or change category filter.</p>
                            </div>
                        ) : (
                            <div className="mt-5 grid gap-3">
                                {filteredResources.map((item) => {
                                    const isSelected = selectedResource?._id === item._id;
                                    return (
                                        <div 
                                            key={item._id} 
                                            className={`rounded-2xl border p-4 transition-all duration-200 ${
                                                isSelected 
                                                    ? 'border-cyan-400 bg-slate-800/90 shadow-lg shadow-cyan-500/5' 
                                                    : 'border-white/10 bg-slate-800/70 hover:border-white/20'
                                            }`}
                                        >
                                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                                {/* Clickable text metadata wrapper block to set active context target */}
                                                <div 
                                                    className="flex-1 cursor-pointer group"
                                                    onClick={() => {
                                                        setSelectedResource(item);
                                                        setMessages([]); // Flush old message arrays on target toggle
                                                    }}
                                                >
                                                    <p className={`text-base font-bold transition-colors ${isSelected ? 'text-cyan-300' : 'text-white group-hover:text-cyan-400'}`}>
                                                        {item.title}
                                                    </p>
                                                    <p className="mt-1 text-sm text-slate-300">{item.subject}</p>
                                                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                                                        <span className="rounded-full border border-cyan-300/30 bg-cyan-400/10 px-2.5 py-1 text-cyan-200">{item.category || "Notes"}</span>
                                                        {item.createdAt && (
                                                            <span className="rounded-full border border-white/20 bg-white/5 px-2.5 py-1 text-slate-200">{formatDate(item.createdAt)}</span>
                                                        )}
                                                        {isSelected && (
                                                            <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1 text-emerald-300 font-mono text-[10px]">Active Context</span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex gap-2 items-center self-end sm:self-start">
                                                    <a
                                                        href={getOpenUrl(item)}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="rounded-lg bg-cyan-400 px-3 py-2 text-xs font-bold text-slate-950 transition hover:brightness-95 text-center"
                                                    >
                                                        Open
                                                    </a>
                                                    <button
                                                        onClick={() => handleDelete(item._id)}
                                                        className="rounded-lg border border-rose-300/30 bg-rose-500/10 px-3 py-2 text-xs font-bold text-rose-200 transition hover:bg-rose-500/20"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </main>
    );
};

export default page;