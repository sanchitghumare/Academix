
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
        <main className="min-h-screen bg-[#09090B] font-sans text-[#FAFAFA] selection:bg-zinc-800 selection:text-white">
            <div className="mx-auto max-w-5xl px-6 py-12">
                {/* Header Metrics Section */}
                <section className="mb-8">
                    <div>
                        <div className="flex flex-row justify-between">
                        <h1 className="text-3xl font-bold tracking-tight text-[#FAFAFA]">Resources</h1>
                        <button
                                    onClick={() => router.push(`/${username}`)}
                                    className="rounded-lg border border-[#27272A] bg-transparent px-4 py-2 text-xs font-semibold text-[#FAFAFA] transition-colors hover:border-zinc-700 hover:bg-zinc-900/50"
                                >
                                    Back to Dashboard
                                </button>
                        </div>
                        <p className="mt-2 text-sm text-[#A1A1AA]">
                            Upload notes, PYQs, and reference files for quick access across your semester.
                        </p>
                    </div>

                    <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <div className="rounded-xl border border-[#27272A] bg-[#111113] p-4">
                            <p className="text-xs font-medium text-[#A1A1AA]">Total Files</p>
                            <p className="mt-2 text-2xl font-bold text-[#FAFAFA]">{resources.length}</p>
                        </div>
                        <div className="rounded-xl border border-[#27272A] bg-[#111113] p-4">
                            <p className="text-xs font-medium text-[#A1A1AA]">Filtered</p>
                            <p className="mt-2 text-2xl font-bold text-[#FAFAFA]">{filteredResources.length}</p>
                        </div>
                        <div className="rounded-xl border border-[#27272A] bg-[#111113] p-4">
                            <p className="text-xs font-medium text-[#A1A1AA]">Category</p>
                            <p className="mt-2 text-2xl font-bold text-[#FAFAFA]">{filter}</p>
                        </div>
                        <div className="rounded-xl border border-[#27272A] bg-[#111113] p-4">
                            <p className="text-xs font-medium text-[#A1A1AA]">User</p>
                            <p className="mt-2 truncate text-2xl font-bold text-[#FAFAFA]">{username}</p>
                        </div>
                    </div>
                </section>

                <div className="mb-8">
                    <hr className="border-[#27272A]" />
                </div>

                {/* Main Action Workspaces */}
                <section className="grid gap-6 lg:grid-cols-[1.1fr_1.9fr]">
                    {/* Left Column Stack: Upload Input + AI Chat Box */}
                    <div className="space-y-6">
                        {/* 1. Upload Component Form */}
                        <div className="rounded-xl border border-[#27272A] bg-[#111113] p-6">
                            <h2 className="text-base font-bold text-[#FAFAFA]">Upload Resource</h2>
                            <p className="mt-1 text-xs text-[#A1A1AA]">Add title, subject, category and file.</p>

                            <form onSubmit={(e) => handleUpload(e)} className="mt-5 space-y-3">
                                <input
                                    type="text"
                                    value={form.title}
                                    onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value || "" }))}
                                    placeholder="Title (e.g. Unit 3 Notes)"
                                    className="w-full rounded-lg border border-[#27272A] bg-[#09090B] px-3.5 py-2 text-sm text-[#FAFAFA] placeholder-[#A1A1AA]/50 outline-none transition-colors focus:border-zinc-500"
                                />
                                <input
                                    type="text"
                                    value={form.subject}
                                    onChange={(e) => setForm((prev) => ({ ...prev, subject: e.target.value }))}
                                    placeholder="Subject (e.g. DBMS)"
                                    className="w-full rounded-lg border border-[#27272A] bg-[#09090B] px-3.5 py-2 text-sm text-[#FAFAFA] placeholder-[#A1A1AA]/50 outline-none transition-colors focus:border-zinc-500"
                                />
                                <select
                                    value={form.category}
                                    onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                                    className="w-full rounded-lg border border-[#27272A] bg-[#09090B] px-3.5 py-2 text-sm text-[#FAFAFA] outline-none transition-colors focus:border-zinc-500"
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
                                    className="w-full rounded-lg border border-[#27272A] bg-[#09090B] px-3 py-1.5 text-xs text-[#FAFAFA] file:mr-3 file:rounded-md file:border-0 file:bg-[#FAFAFA] file:px-3 file:py-1 file:text-xs file:font-semibold file:text-black hover:file:bg-zinc-200"
                                />
                                <button
                                    type="submit"
                                    disabled={isUploading}
                                    className="w-full rounded-lg bg-[#FAFAFA] py-2 text-xs font-semibold text-black transition-colors hover:bg-zinc-200 disabled:opacity-50"
                                >
                                    {isUploading ? "Uploading..." : "Upload"}
                                </button>
                            </form>
                        </div>

                        {/* 2. Interactive AI Chat Assistant Box */}
                        <div className="flex flex-col gap-5 rounded-xl border border-[#27272A] bg-[#111113] p-6">
                            <div className="rounded-lg border border-[#27272A] bg-[#09090B] p-4">
                                <div className="border-b border-[#27272A]/50 pb-3">
                                    <h2 className="text-sm font-bold text-[#FAFAFA]">AI Study Chat</h2>
                                    <p className="mt-0.5 truncate text-[11px] text-[#A1A1AA]">
                                        {selectedResource ? `Active Context: ${selectedResource.title}` : "Select a document card to lock context"}
                                    </p>
                                </div>

                                <div className="flex-1 space-y-2.5 overflow-y-auto py-4 pr-1 text-xs">
                                    {messages.length === 0 ? (
                                        <div className="flex h-full items-center justify-center px-4 py-6 text-center text-xs text-[#A1A1AA]/60">
                                            {selectedResource
                                                ? "Ask anything about this resource!"
                                                : "Click a resource card on the right to lock it into AI context."}
                                        </div>
                                    ) : (
                                        messages.map((msg, idx) => (
                                            <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                                                <div
                                                    className={`max-w-[85%] rounded-lg px-3 py-2 text-xs leading-relaxed ${msg.role === "user"
                                                            ? "bg-[#FAFAFA] font-medium text-black"
                                                            : "border border-[#27272A] bg-[#111113] text-[#FAFAFA]"
                                                        }`}
                                                >
                                                    {msg.text}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                    {loading && (
                                        <div className="text-[10px] text-[#A1A1AA] animate-pulse">
                                             AI running...
                                        </div>
                                    )}
                                </div>

                                <form onSubmit={askAIAboutResource} className="flex gap-2 border-t border-[#27272A]/50 pt-2.5">
                                    <input
                                        type="text"
                                        placeholder={selectedResource ? "Query this document..." : "Lock a file context to begin"}
                                        disabled={!selectedResource || loading}
                                        value={inputQuestion}
                                        onChange={(e) => setInputQuestion(e.target.value)}
                                        className="flex-1 rounded-md border border-[#27272A] bg-[#111113] px-3 py-1.5 text-xs text-[#FAFAFA] placeholder-[#A1A1AA]/40 outline-none transition-colors focus:border-zinc-500 disabled:opacity-40"
                                    />
                                    <button
                                        type="submit"
                                        disabled={loading || !selectedResource || !inputQuestion.trim()}
                                        className="rounded-md bg-[#FAFAFA] px-3 py-1.5 text-xs font-semibold text-black transition-colors hover:bg-zinc-200 disabled:opacity-40"
                                    >
                                        Ask
                                    </button>
                                </form>
                            </div>

                            {/* Quiz Generation Section */}
                            <div className="rounded-lg border border-[#27272A] bg-[#09090B] p-4">
                                <div className="flex flex-col gap-3 border-b border-[#27272A]/50 pb-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <h2 className="text-sm font-bold text-[#FAFAFA]">Resource Quiz</h2>
                                        <p className="mt-0.5 text-[11px] text-[#A1A1AA]">
                                            {selectedResource ? `5-question quiz from ${selectedResource.title}` : "Select a resource to generate a quiz"}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={GenerateQuiz}
                                        disabled={loading || !selectedResource}
                                        className="rounded-md bg-[#FAFAFA] px-3 py-1.5 text-xs font-semibold text-black transition-colors hover:bg-zinc-200 disabled:opacity-40"
                                    >
                                        {loading ? "Generating..." : "Generate Quiz"}
                                    </button>
                                </div>

                                {quizError && (
                                    <p className="mt-3 rounded-md border border-rose-900/50 bg-rose-950/20 px-3 py-2 text-xs text-rose-300">
                                        {quizError}
                                    </p>
                                )}

                                {quizData?.questions?.length ? (
                                    <div className="mt-4 space-y-4">
                                        <div className="rounded-md border border-[#27272A] bg-[#111113] p-3 text-xs text-[#A1A1AA]">
                                            <p className="font-semibold text-[#FAFAFA]">{quizData.title}</p>
                                            <p className="mt-1">{quizData.instructions}</p>
                                            <p className="mt-2 text-[#FAFAFA]">
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
                                                    <div key={question.id || questionIndex} className="rounded-lg border border-[#27272A] bg-[#111113] p-3.5">
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div>
                                                                <p className="text-xs font-semibold text-[#FAFAFA]">
                                                                    {questionIndex + 1}. {question.question}
                                                                </p>
                                                                <p className="mt-1 text-[11px] text-[#A1A1AA]">
                                                                    Your answer: {selectedLabel}
                                                                    {isSubmitted ? ` | Correct: ${correctLabel}` : ""}
                                                                </p>
                                                            </div>
                                                            {isSubmitted && (
                                                                <span
                                                                    className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${selectedAnswer === question.correctIndex
                                                                            ? "bg-emerald-950/40 text-emerald-400 border border-emerald-800/40"
                                                                            : "bg-rose-950/40 text-rose-400 border border-rose-800/40"
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
                                                                        className={`rounded-md border px-3 py-1.5 text-left text-xs transition-colors ${showCorrectState
                                                                                ? "border-emerald-700/60 bg-emerald-950/30 text-emerald-200"
                                                                                : showWrongState
                                                                                    ? "border-rose-700/60 bg-rose-950/30 text-rose-200"
                                                                                    : isSelected
                                                                                        ? "border-zinc-500 bg-[#27272A]/60 text-[#FAFAFA]"
                                                                                        : "border-[#27272A] bg-[#09090B] text-[#A1A1AA] hover:border-zinc-700 hover:text-[#FAFAFA]"
                                                                            }`}
                                                                    >
                                                                        <span className="mr-2 font-bold">{String.fromCharCode(65 + optionIndex)}.</span>
                                                                        {option}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>

                                                        {isSubmitted && question.explanation && (
                                                            <p className="mt-3 rounded-md border border-[#27272A] bg-[#09090B] px-3 py-2 text-[11px] text-[#A1A1AA]">
                                                                {question.explanation}
                                                            </p>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        <div className="flex flex-col gap-3 rounded-lg border border-[#27272A] bg-[#111113] p-3.5 sm:flex-row sm:items-center sm:justify-between">
                                            <p className="text-xs text-[#A1A1AA]">
                                                {quizScore === null
                                                    ? "Answer questions, then submit to see your score."
                                                    : `Final score: ${quizScore}/${quizData.questions.length}`}
                                            </p>
                                            <button
                                                type="button"
                                                onClick={submitQuiz}
                                                disabled={quizSubmitting || !quizData.questions.length}
                                                className="rounded-md bg-[#FAFAFA] px-3.5 py-1.5 text-xs font-semibold text-black transition-colors hover:bg-zinc-200 disabled:opacity-40"
                                            >
                                                {quizSubmitting ? "Scoring..." : quizScore === null ? "Submit Quiz" : "Rescore"}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="mt-4 rounded-lg border border-dashed border-[#27272A] bg-[#09090B] p-6 text-center text-xs text-[#A1A1AA]">
                                        No quiz generated yet.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column Layout: Display Resources Grid List */}
                    <div className="rounded-xl border border-[#27272A] bg-[#111113] p-6">
                        <div className="flex items-center justify-between border-b border-[#27272A]/50 pb-4">
                            <h2 className="text-base font-bold text-[#FAFAFA]">All Resources</h2>
                            <select
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                                className="rounded-lg border border-[#27272A] bg-[#09090B] px-3 py-1.5 text-xs font-medium text-[#FAFAFA] outline-none transition-colors focus:border-zinc-500"
                            >
                                <option value="All">All</option>
                                {categories.map((item) => (
                                    <option key={item} value={item}>{item}</option>
                                ))}
                            </select>
                        </div>

                        {isLoading ? (
                            <div className="mt-6 rounded-lg border border-[#27272A] bg-[#09090B] p-8 text-center text-xs text-[#A1A1AA]">
                                Loading resources...
                            </div>
                        ) : filteredResources.length === 0 ? (
                            <div className="mt-6 rounded-lg border border-dashed border-[#27272A] bg-[#09090B] p-8 text-center">
                                <p className="text-sm font-semibold text-[#FAFAFA]">No resources found</p>
                                <p className="mt-1 text-xs text-[#A1A1AA]">Upload your first file or change category filter.</p>
                            </div>
                        ) : (
                            <div className="mt-4 space-y-2.5">
                                {filteredResources.map((item) => {
                                    const isSelected = selectedResource?._id === item._id;
                                    return (
                                        <div
                                            key={item._id}
                                            className={`rounded-lg border p-4 transition-all duration-150 ${isSelected
                                                    ? 'border-zinc-500 bg-[#09090B]'
                                                    : 'border-[#27272A] bg-[#09090B] hover:border-zinc-700'
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
                                                    <p className={`text-sm font-semibold transition-colors ${isSelected ? 'text-[#FAFAFA]' : 'text-[#FAFAFA] group-hover:text-zinc-300'}`}>
                                                        {item.title}
                                                    </p>
                                                    <p className="mt-0.5 text-xs text-[#A1A1AA]">{item.subject}</p>
                                                    <div className="mt-2 flex flex-wrap gap-2 text-[10px]">
                                                        <span className="rounded-md border border-[#27272A] bg-[#111113] px-2 py-0.5 text-[#A1A1AA]">{item.category || "Notes"}</span>
                                                        {item.createdAt && (
                                                            <span className="rounded-md border border-[#27272A] bg-[#111113] px-2 py-0.5 text-[#A1A1AA]">{formatDate(item.createdAt)}</span>
                                                        )}
                                                        {isSelected && (
                                                            <span className="rounded-md border border-emerald-800/40 bg-emerald-950/40 px-2 py-0.5 text-emerald-400 font-medium">Active Context</span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex gap-1.5 items-center self-end sm:self-start">
                                                    <a
                                                        href={getOpenUrl(item)}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="rounded-md bg-[#FAFAFA] px-2.5 py-1 text-xs font-medium text-black transition-colors hover:bg-zinc-200 text-center"
                                                    >
                                                        Open
                                                    </a>
                                                    <button
                                                        onClick={() => handleDelete(item._id)}
                                                        className="rounded-md border border-[#27272A] bg-transparent px-2.5 py-1 text-xs font-medium text-rose-400/80 transition-colors hover:border-rose-900/50 hover:text-rose-400"
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