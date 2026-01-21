"use client";

import { useState } from "react";

interface EvaluationResult {
    verdict: string;
    pros: string;
    cons: string;
    advice: string;
}

export default function PlanPage() {
    const [userPlan, setUserPlan] = useState("");
    const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleEvaluate = async () => {
        if (!userPlan.trim()) return;
        setLoading(true);
        setError(null);
        setEvaluation(null);
        try {
            const response = await fetch("http://localhost:8000/api/v1/dashboard/evaluate-plan", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ user_id: 1, user_plan: userPlan }),
            });
            const data = await response.json();
            if (data.error) {
                setError(data.error);
            } else {
                setEvaluation(data);
            }
        } catch (err) {
            console.error("Error evaluating plan:", err);
            setError("서버와의 통신에 실패했습니다. 연결 상태를 확인해주세요.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900">
            {/* Sidebar */}
            <aside className="w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 hidden md:flex flex-col p-6">
                <h1 className="text-2xl font-bold text-emerald-600 mb-8">VibeHealth</h1>
                <nav className="space-y-4">
                    <a href="/" className="block px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700">Dashboard</a>
                    <a href="/diet" className="block px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700">Diet Log</a>
                    <a href="/exercise" className="block px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700">Exercise</a>
                    <a href="/plan" className="block px-4 py-2 rounded-xl bg-emerald-50 text-emerald-700 font-medium font-semibold text-emerald-600">✨ Plan Evaluator</a>
                </nav>
            </aside>

            <main className="flex-1 p-8 overflow-auto">
                <header className="max-w-3xl mx-auto mb-12 text-center">
                    <h1 className="text-4xl font-extrabold text-slate-800 dark:text-white mb-4 bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-500">
                        AI Plan Evaluator
                    </h1>
                    <p className="text-lg text-slate-500">
                        Describe your health goal or daily plan, and our AI will critique it based on your history.
                    </p>
                </header>

                <div className="max-w-4xl mx-auto space-y-8">
                    {/* Input Section */}
                    <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-sm border border-slate-200 dark:border-slate-700">
                        <textarea
                            className="w-full h-32 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-slate-700 dark:text-slate-200"
                            placeholder="e.g., 오늘은 저녁을 굶고 공원 10km 러닝을 할 계획입니다. 단백질 셰이크 하나만 마실 거예요."
                            value={userPlan}
                            onChange={(e) => setUserPlan(e.target.value)}
                        />
                        <button
                            onClick={handleEvaluate}
                            disabled={loading || !userPlan.trim()}
                            className="mt-4 w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl font-bold shadow-lg shadow-emerald-200 dark:shadow-none hover:shadow-xl disabled:opacity-50 transition-all flex items-center justify-center"
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                                    Evaluating...
                                </>
                            ) : "✨ Critique My Plan"}
                        </button>
                    </div>

                    {/* Error Section */}
                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-2xl text-red-600 dark:text-red-400 text-sm font-medium flex items-center animate-in fade-in duration-300">
                            <span className="mr-2">❌</span> {error}
                        </div>
                    )}

                    {/* Result Section */}
                    {evaluation && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="bg-white dark:bg-slate-800 rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-xl">
                                <div className={`p-6 flex items-center justify-between ${evaluation.verdict === "Risky" || evaluation.verdict === "Bad"
                                    ? "bg-amber-500" : "bg-emerald-600"
                                    } text-white`}>
                                    <div className="flex items-center">
                                        <span className="text-2xl mr-3 font-bold">Verdict:</span>
                                        <span className="text-3xl font-black uppercase tracking-tight">{evaluation.verdict}</span>
                                    </div>
                                    <span className="text-4xl">🤖</span>
                                </div>

                                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <h3 className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center">
                                            <span className="mr-2">✅</span> Pros
                                        </h3>
                                        <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                                            {evaluation.pros}
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="font-bold text-amber-600 dark:text-amber-400 flex items-center">
                                            <span className="mr-2">⚠️</span> Cons / Risks
                                        </h3>
                                        <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                                            {evaluation.cons}
                                        </p>
                                    </div>
                                    <div className="md:col-span-2 mt-4 p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                                        <h3 className="font-bold text-slate-800 dark:text-white mb-2 flex items-center">
                                            <span className="mr-2">💡</span> AI Advice
                                        </h3>
                                        <p className="text-slate-600 dark:text-slate-300 text-base italic leading-relaxed">
                                            "{evaluation.advice}"
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
