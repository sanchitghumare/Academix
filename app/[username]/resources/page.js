
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
    const [quizData, setQuizData] = useState(null);
    const [quizAnswers, setQuizAnswers] = useState([]);
    const [quizScore, setQuizScore] = useState(null);
    const [quizSubmitting, setQuizSubmitting] = useState(false);
    const [quizError, setQuizError] = useState("");

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
    const GenerateQuiz = async () => {  
        if (!selectedResource) return;

        const activeFileName = selectedResource.fileName || selectedResource.title;
        setQuizError("");
        setLoading(true);

        try {
            const res = await fetch("/api/resources/quiz", { 
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ filename: activeFileName, resourceTitle: selectedResource.title }),
            });
            const data = await res.json();
            if (!res.ok || !data?.quiz) {
                throw new Error(data?.error || "No quiz received.");
            }

            setQuizData(data.quiz);
            setQuizAnswers(Array(data.quiz.questions?.length || 0).fill(null));
            setQuizScore(null);
        } catch (err) {
            console.error("Error generating quiz:", err);
            setQuizError(err?.message || "Error connecting to local AI engine.");
        } finally {
            setLoading(false);
        }
    };

    const handleQuizAnswer = (questionIndex, optionIndex) => {
        setQuizAnswers((prev) => {
            const nextAnswers = [...prev];
            nextAnswers[questionIndex] = optionIndex;
            return nextAnswers;
        });
    };

    const submitQuiz = () => {
        if (!quizData?.questions?.length) return;

        setQuizSubmitting(true);
        const score = quizData.questions.reduce((total, question, index) => {
            return total + (quizAnswers[index] === question.correctIndex ? 1 : 0);
        }, 0);

        setQuizScore(score);
        setQuizSubmitting(false);
    };

    const currentQuizCount = quizAnswers.filter((answer) => answer !== null && answer !== undefined).length;
    return (
        <main className="min-h-screen bg-transparent px-4 py-10 text-white md:px-8">
            <div className="mx-auto max-w-7xl">
                {/* Header Metrics Section */}
            <section className="rounded-3xl border border-white/8 bg-[#121a2b] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.28)] md:p-8">
                    <p className="mb-3 inline-flex rounded-full border border-cyan-300/30 bg-cyan-400/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-cyan-200">
                        Shared Study Hub
                    </p>
                    <h1 className="text-3xl font-black tracking-tight md:text-5xl">Resources</h1>
                    <p className="mt-3 max-w-2xl text-sm text-slate-300 md:text-base">
                        Upload notes, PYQs and reference files for quick access across your semester.
                    </p>

                    <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="rounded-2xl border border-white/8 bg-[#0f1728] p-4">
                            <p className="text-xs uppercase tracking-wider text-slate-400">Total Files</p>
                            <p className="mt-2 text-2xl font-extrabold">{resources.length}</p>
                        </div>
                        <div className="rounded-2xl border border-white/8 bg-[#0f1728] p-4">
                            <p className="text-xs uppercase tracking-wider text-slate-400">Filtered</p>
                            <p className="mt-2 text-2xl font-extrabold">{filteredResources.length}</p>
                        </div>
                        <div className="rounded-2xl border border-white/8 bg-[#0f1728] p-4">
                            <p className="text-xs uppercase tracking-wider text-slate-400">Category</p>
                            <p className="mt-2 text-2xl font-extrabold text-cyan-300">{filter}</p>
                        </div>
                        <div className="rounded-2xl border border-white/8 bg-[#0f1728] p-4">
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
                        <div className="rounded-3xl border border-white/8 bg-[#121a2b] p-5">
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
                        <div className="rounded-3xl border border-white/8 bg-[#121a2b] p-5 flex flex-col gap-5">
                            <div className="rounded-2xl border border-white/8 bg-[#0f1728] p-4">
                                <div className="border-b border-white/8 pb-3">
                                    <h2 className="text-xl font-black text-cyan-300">Stratos AI Study Chat</h2>
                                    <p className="mt-0.5 truncate text-xs text-slate-400">
                                        {selectedResource ? `Active Context: ${selectedResource.title}` : "Select a document card to talk with AI"}
                                    </p>
                                </div>

                                <div className="flex-1 overflow-y-auto space-y-3 py-4 pr-1 text-sm scrollbar-thin">
                                    {messages.length === 0 ? (
                                        <div className="flex h-full items-center justify-center px-4 text-center text-xs text-slate-500">
                                            {selectedResource
                                                ? "Ask anything!"
                                                : "Click a resource card's text block on the right to lock it into the AI context window."}
                                        </div>
                                    ) : (
                                        messages.map((msg, idx) => (
                                            <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                                                <div
                                                    className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                                                        msg.role === "user"
                                                            ? "bg-cyan-500 font-medium text-slate-950"
                                                            : "border border-white/5 bg-slate-800 text-slate-100"
                                                    }`}
                                                >
                                                    {msg.text}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                    {loading && (
                                        <div className="font-mono text-[10px] tracking-wide text-cyan-400/70 animate-pulse">
                                            Stratos AI running local inference math loops...
                                        </div>
                                    )}
                                </div>

                                <form onSubmit={askAIAboutResource} className="flex gap-2 border-t border-white/8 pt-2">
                                    <input
                                        type="text"
                                        placeholder={selectedResource ? "Query this document..." : "Lock a file context to begin"}
                                        disabled={!selectedResource || loading}
                                        value={inputQuestion}
                                        onChange={(e) => setInputQuestion(e.target.value)}
                                        className="flex-1 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs outline-none transition focus:border-cyan-300 disabled:opacity-40"
                                    />
                                    <button
                                        type="submit"
                                        disabled={loading || !selectedResource || !inputQuestion.trim()}
                                        className="rounded-xl bg-cyan-400 px-4 py-2 text-xs font-bold text-slate-950 transition-all hover:brightness-95 disabled:opacity-40"
                                    >
                                        Ask
                                    </button>
                                </form>
                            </div>

                            <div className="rounded-2xl border border-white/8 bg-[#0f1728] p-4">
                                <div className="flex flex-col gap-3 border-b border-white/8 pb-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <h2 className="text-xl font-black text-emerald-300">Resource Quiz</h2>
                                        <p className="mt-0.5 text-xs text-slate-400">
                                            {selectedResource ? `Generate a 5-question quiz from ${selectedResource.title}` : "Select a resource to generate a quiz"}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={GenerateQuiz}
                                        disabled={loading || !selectedResource}
                                        className="rounded-xl bg-emerald-400 px-4 py-2 text-xs font-black text-slate-950 transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        {loading ? "Generating..." : "Generate Quiz"}
                                    </button>
                                </div>

                                {quizError && (
                                    <p className="mt-3 rounded-xl border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
                                        {quizError}
                                    </p>
                                )}

                                {quizData?.questions?.length ? (
                                    <div className="mt-4 space-y-4">
                                        <div className="rounded-xl border border-white/8 bg-white/5 p-3 text-xs text-slate-300">
                                            <p className="font-semibold text-white">{quizData.title}</p>
                                            <p className="mt-1">{quizData.instructions}</p>
                                            <p className="mt-2 text-cyan-300">
                                                Current answers: {currentQuizCount}/{quizData.questions.length}
                                            </p>
                                        </div>

                                        <div className="space-y-3">
                                            {quizData.questions.map((question, questionIndex) => {
                                                const selectedAnswer = quizAnswers[questionIndex];
                                                const isSubmitted = quizScore !== null;
                                                const selectedLabel = selectedAnswer === null || selectedAnswer === undefined
                                                    ? "Not answered"
                                                    : String.fromCharCode(65 + selectedAnswer);
                                                const correctLabel = String.fromCharCode(65 + question.correctIndex);

                                                return (
                                                    <div key={question.id || questionIndex} className="rounded-2xl border border-white/8 bg-[#121a2b] p-4">
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div>
                                                                <p className="text-sm font-semibold text-white">
                                                                    {questionIndex + 1}. {question.question}
                                                                </p>
                                                                <p className="mt-1 text-[11px] text-slate-400">
                                                                    Your answer: {selectedLabel}
                                                                    {isSubmitted ? ` | Correct: ${correctLabel}` : ""}
                                                                </p>
                                                            </div>
                                                            {isSubmitted && (
                                                                <span
                                                                    className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                                                                        selectedAnswer === question.correctIndex
                                                                            ? "bg-emerald-400/15 text-emerald-300"
                                                                            : "bg-rose-400/15 text-rose-300"
                                                                    }`}
                                                                >
                                                                    {selectedAnswer === question.correctIndex ? "Correct" : "Wrong"}
                                                                </span>
                                                            )}
                                                        </div>

                                                        <div className="mt-3 grid gap-2 sm:grid-cols-2">
                                                            {question.options.map((option, optionIndex) => {
                                                                const isSelected = selectedAnswer === optionIndex;
                                                                const isCorrect = question.correctIndex === optionIndex;
                                                                const showCorrectState = isSubmitted && isCorrect;
                                                                const showWrongState = isSubmitted && isSelected && !isCorrect;

                                                                return (
                                                                    <button
                                                                        key={`${question.id || questionIndex}-${optionIndex}`}
                                                                        type="button"
                                                                        onClick={() => handleQuizAnswer(questionIndex, optionIndex)}
                                                                        className={`rounded-xl border px-3 py-2 text-left text-xs transition ${
                                                                            showCorrectState
                                                                                ? "border-emerald-400/40 bg-emerald-400/15 text-emerald-100"
                                                                                : showWrongState
                                                                                    ? "border-rose-400/40 bg-rose-400/15 text-rose-100"
                                                                                    : isSelected
                                                                                        ? "border-cyan-400/40 bg-cyan-400/15 text-cyan-100"
                                                                                        : "border-white/8 bg-[#182238] text-slate-200 hover:border-white/15"
                                                                        }`}
                                                                    >
                                                                        <span className="mr-2 font-bold">{String.fromCharCode(65 + optionIndex)}.</span>
                                                                        {option}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>

                                                        {isSubmitted && question.explanation && (
                                                            <p className="mt-3 rounded-xl border border-white/8 bg-white/5 px-3 py-2 text-[11px] text-slate-300">
                                                                {question.explanation}
                                                            </p>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        <div className="flex flex-col gap-3 rounded-2xl border border-white/8 bg-[#0f1728] p-4 sm:flex-row sm:items-center sm:justify-between">
                                            <p className="text-sm text-slate-300">
                                                {quizScore === null
                                                    ? "Answer all or some questions, then submit to see your score."
                                                    : `Final score: ${quizScore}/${quizData.questions.length}`}
                                            </p>
                                            <button
                                                type="button"
                                                onClick={submitQuiz}
                                                disabled={quizSubmitting || !quizData.questions.length}
                                                className="rounded-xl bg-white px-4 py-2 text-xs font-black text-slate-950 transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                {quizSubmitting ? "Scoring..." : quizScore === null ? "Submit Quiz" : "Rescore"}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="mt-4 rounded-2xl border border-dashed border-white/15 bg-white/5 p-6 text-center text-sm text-slate-400">
                                        No quiz generated yet.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column Layout: Display Resources Grid List */}
                    <div className="rounded-3xl border border-white/8 bg-[#121a2b] p-5">
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
                            <div className="mt-6 rounded-2xl border border-white/8 bg-[#0f1728] p-6 text-center text-sm text-slate-300">
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
                                                        setQuizData(null);
                                                        setQuizAnswers([]);
                                                        setQuizScore(null);
                                                        setQuizError("");
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