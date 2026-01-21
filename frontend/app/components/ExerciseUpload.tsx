"use client";

import { useState, useRef } from "react";
import Image from "next/image";

interface ExerciseAnalysisResult {
    image_path: string | null;
    analysis: {
        exercise_type: string;
        feedback: string;
        recommendation: string;
    }
}

export default function ExerciseUpload() {
    const [file, setFile] = useState<File | null>(null);
    const [textInput, setTextInput] = useState("");
    const [preview, setPreview] = useState<string | null>(null);
    const [isVideo, setIsVideo] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [result, setResult] = useState<ExerciseAnalysisResult | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            setResult(null);

            const fileType = selectedFile.type;
            if (fileType.startsWith("video/")) {
                setIsVideo(true);
                setPreview(URL.createObjectURL(selectedFile));
            } else {
                setIsVideo(false);
                setPreview(URL.createObjectURL(selectedFile));
            }
        }
    };

    const handleUpload = async () => {
        // Validation: Need at least file OR text
        if (!file && !textInput.trim()) {
            alert("Please provide a file or text description.");
            return;
        }

        setIsUploading(true);
        const formData = new FormData();
        if (file) {
            formData.append("file", file);
        }
        formData.append("text_input", textInput);

        try {
            const response = await fetch("http://localhost:8000/api/v1/exercise/analyze", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) throw new Error("Analysis failed");

            const data = await response.json();
            setResult(data);
        } catch (error) {
            console.error(error);
            alert("Failed to analyze exercise. Please try again.");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto">
            {!result ? (
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-8">
                    {/* Upload Area */}
                    <div
                        className="border-2 border-dashed border-emerald-100 hover:border-emerald-300 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-50 dark:bg-slate-900/50"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*,video/*"
                            onChange={handleFileChange}
                        />

                        {preview ? (
                            <div className="relative w-full h-48 mb-2">
                                {isVideo ? (
                                    <video src={preview} controls className="w-full h-full object-contain rounded-lg" />
                                ) : (
                                    <Image src={preview} alt="Preview" layout="fill" objectFit="contain" className="rounded-lg" />
                                )}
                                <button
                                    onClick={(e) => { e.stopPropagation(); setFile(null); setPreview(null); }}
                                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 text-xs"
                                >
                                    ✕
                                </button>
                            </div>
                        ) : (
                            <>
                                <span className="text-4xl mb-2">🏋️‍♀️</span>
                                <p className="text-slate-500 font-medium">Upload Photo / Video (Optional)</p>
                            </>
                        )}
                    </div>

                    {/* Text Input Area */}
                    <div className="mt-6">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Description or YouTube URL
                        </label>
                        <textarea
                            className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                            placeholder="e.g. 'Checking my squat form' OR paste a YouTube link..."
                            rows={3}
                            value={textInput}
                            onChange={(e) => setTextInput(e.target.value)}
                        />
                    </div>

                    <button
                        onClick={handleUpload}
                        disabled={isUploading}
                        className="w-full mt-6 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 rounded-xl transition-all disabled:opacity-50 flex justify-center items-center"
                    >
                        {isUploading ? (
                            <>
                                <span className="mr-2">⚡</span> Analyzing...
                            </>
                        ) : "Analyze Exercise"}
                    </button>
                </div>
            ) : (
                /* Result View */
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <div className="p-6">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-2xl font-bold text-slate-800 dark:text-white">
                                {result.analysis.exercise_type}
                            </h3>
                            {result.image_path && (
                                <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded">Media Logged</span>
                            )}
                        </div>

                        <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-xl border border-emerald-100 dark:border-emerald-800 mb-4">
                            <p className="font-semibold text-emerald-800 dark:text-emerald-200 mb-2">Feedback</p>
                            <p className="text-slate-700 dark:text-slate-300 whitespace-pre-line">{result.analysis.feedback}</p>
                        </div>

                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800 mb-6">
                            <p className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Recommendation</p>
                            <p className="text-slate-700 dark:text-slate-300">{result.analysis.recommendation}</p>
                        </div>

                        <div className="flex gap-4">
                            <button onClick={() => setResult(null)} className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium">
                                Discard
                            </button>
                            <button
                                onClick={() => {
                                    fetch("http://localhost:8000/api/v1/exercise/confirm", {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({ ...result, user_id: 1 })
                                    }).then(() => {
                                        alert("Workout Logged!");
                                        setFile(null);
                                        setPreview(null);
                                        setResult(null);
                                        setTextInput("");
                                    });
                                }}
                                className="w-full flex-1 py-3 rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 font-medium"
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
