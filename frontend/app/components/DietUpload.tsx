"use client";

import { useState, useRef } from "react";
import Image from "next/image";

interface DietAnalaysisResult {
  image_path: string | null;
  analysis: {
    items: {
      name: string;
      kcal: number;
      carbs: number;
      protein: number;
      fat: number;
    }[];
    total_kcal: number;
    advice: string;
  }
}

export default function DietUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [textInput, setTextInput] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<DietAnalaysisResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file && !textInput.trim()) {
      alert("Please upload a photo or enter text.");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    if (file) {
      formData.append("file", file);
    }
    formData.append("text_input", textInput);

    try {
      const response = await fetch("http://localhost:8000/api/v1/diet/analyze", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Analysis failed");

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error(error);
      alert("Failed to analyze. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Upload Area */}
      {!result ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-8">
          <div
            className="border-2 border-dashed border-emerald-100 hover:border-emerald-300 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-50 dark:bg-slate-900/50"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleFileChange}
            />

            {preview ? (
              <div className="relative w-64 h-64 mb-4">
                <Image src={preview} alt="Preview" layout="fill" objectFit="cover" className="rounded-lg" />
              </div>
            ) : (
              <>
                <span className="text-4xl mb-4">🥘</span>
                <p className="text-slate-500 font-medium">Click to upload food photo (Optional)</p>
              </>
            )}
          </div>

          {/* Text Input */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Meal Description / Notes
            </label>
            <textarea
              className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              placeholder="e.g. 'I accepted the kimchi on the side but didn't eat the rice.'"
              rows={2}
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
            />
          </div>

          <button
            onClick={handleUpload}
            disabled={isUploading}
            className="w-full mt-6 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 rounded-xl transition-all disabled:opacity-50 flex justify-center items-center"
          >
            {isUploading ? "Analyzing..." : "Analyze Food"}
          </button>
        </div>
      ) : (
        /* Result View */
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
          {preview && (
            <div className="relative h-48 w-full bg-slate-100">
              <Image src={preview} alt="Analyzed Food" layout="fill" objectFit="cover" />
            </div>
          )}

          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <p className="text-sm text-slate-500 uppercase tracking-wide font-semibold">Total Calories</p>
                <p className="text-3xl font-bold text-emerald-600">{result.analysis.total_kcal} kcal</p>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              {result.analysis.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-100 dark:border-slate-600">
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">{item.name}</p>
                    <p className="text-xs text-slate-500">C: {item.carbs}g / P: {item.protein}g / F: {item.fat}g</p>
                  </div>
                  <span className="font-medium text-slate-600 dark:text-slate-300">{item.kcal} kcal</span>
                </div>
              ))}
            </div>

            <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-xl border border-emerald-100 dark:border-emerald-800 mb-6">
              <p className="text-emerald-800 dark:text-emerald-200 text-sm">
                💡 <strong>AI Tip:</strong> {result.analysis.advice}
              </p>
            </div>

            <div className="flex gap-4">
              <button onClick={() => setResult(null)} className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium">
                Discard
              </button>
              <button
                className="flex-1 py-3 rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 font-medium shadow-md shadow-emerald-200 dark:shadow-none"
                onClick={() => {
                  fetch("http://localhost:8000/api/v1/diet/confirm", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ ...result, user_id: 1 })
                  }).then(() => {
                    alert("Meal Logged!");
                    setFile(null);
                    setPreview(null);
                    setResult(null);
                    setTextInput("");
                  });
                }}
              >
                Confirm & Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
