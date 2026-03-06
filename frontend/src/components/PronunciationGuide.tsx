"use client";

import { useState, useEffect } from "react";

interface PronunciationGuideProps {
    text: string;
    language: "vi" | "en" | "ja";
}

interface PronunciationData {
    original: string;
    pronunciation: string;
    language: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function PronunciationGuide({ text, language }: PronunciationGuideProps) {
    const [data, setData] = useState<PronunciationData | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!text.trim()) {
            setData(null);
            return;
        }

        const timer = setTimeout(() => {
            setLoading(true);
            fetch(`${API_URL}/api/v1/pronunciation`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: text.trim(), language }),
            })
                .then((r) => r.json())
                .then(setData)
                .catch(() => setData(null))
                .finally(() => setLoading(false));
        }, 500); // debounce

        return () => clearTimeout(timer);
    }, [text, language]);

    if (!text.trim()) return null;

    const labels: Record<string, string> = {
        vi: "Thanh điệu",
        en: "IPA Phiên âm",
        ja: "Romaji",
    };

    return (
        <div className="pronunciation">
            <div className="pronunciation__header">
                <span className="pronunciation__label">📖 {labels[language]}</span>
                {loading && <span className="pronunciation__loading">Đang phân tích...</span>}
            </div>
            {data && data.pronunciation && (
                <div className="pronunciation__content">
                    <p className="pronunciation__text">{data.pronunciation}</p>
                </div>
            )}
        </div>
    );
}
