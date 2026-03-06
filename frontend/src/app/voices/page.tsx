"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";

const API_URL = process.env.NEXT_PUBLIC_API_URL || (typeof window !== "undefined" ? `http://${window.location.hostname}:7001` : "http://localhost:7001");

interface VoiceProfile {
    id: string;
    name: string;
    language: string;
    gender: string;
    engine: string;
    is_cloned: boolean;
    badge: string;
}

const LANG_FLAGS: Record<string, string> = { vi: "🇻🇳", en: "🇬🇧", ja: "🇯🇵" };

export default function VoicesPage() {
    const [voices, setVoices] = useState<VoiceProfile[]>([]);
    const [filter, setFilter] = useState("all");
    const [previewId, setPreviewId] = useState<string | null>(null);

    useEffect(() => {
        const lang = filter !== "all" ? `?language=${filter}` : "";
        fetch(`${API_URL}/api/v1/voices/gallery${lang}`)
            .then((r) => r.json())
            .then((d) => setVoices(d.voices))
            .catch(() => { });
    }, [filter]);

    const handlePreview = async (voice: VoiceProfile) => {
        setPreviewId(voice.id);
        const sample: Record<string, string> = { vi: "Xin chào", en: "Hello", ja: "こんにちは" };
        try {
            const res = await fetch(`${API_URL}/api/v1/tts`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: sample[voice.language] || "Hello", language: voice.language, voice_id: voice.id }),
            });
            const data = await res.json();
            if (data.audio_url) {
                const audio = new Audio(`${API_URL}${data.audio_url}`);
                audio.play();
                audio.onended = () => setPreviewId(null);
            }
        } catch { setPreviewId(null); }
    };

    return (
        <>
            <Navbar />
            <main className="gallery">
                <div className="gallery__container">
                    <header className="gallery__header">
                        <h1 className="gallery__title">🎤 Voice Gallery</h1>
                        <p className="gallery__subtitle">Chọn giọng đọc cho bài học</p>
                    </header>



                    <div className="history__filters">
                        {["all", "vi", "en"].map((lang) => (
                            <button key={lang} className={`history__filter ${filter === lang ? "history__filter--active" : ""}`} onClick={() => setFilter(lang)}>
                                {lang === "all" ? "🌐 Tất cả" : `${LANG_FLAGS[lang]} ${lang.toUpperCase()}`}
                            </button>
                        ))}
                    </div>

                    <div className="gallery__grid">
                        {voices.map((v) => (
                            <div key={v.id} className="voice-card">
                                <div className="voice-card__avatar">{LANG_FLAGS[v.language] || "🎙️"}</div>
                                <div className="voice-card__info">
                                    <h3 className="voice-card__name">{v.name}</h3>
                                    <p className="voice-card__meta">{v.gender} · {v.engine}</p>
                                </div>
                                <span className={`voice-card__badge ${v.is_cloned ? "voice-card__badge--cloned" : ""}`}>
                                    {v.badge}
                                </span>
                                <div className="voice-card__actions">
                                    <button className="voice-card__btn" onClick={() => handlePreview(v)} disabled={previewId === v.id}>
                                        {previewId === v.id ? "🔊..." : "▶️ Preview"}
                                    </button>
                                    <a href={`/studio?voice=${v.id}&lang=${v.language}`} className="voice-card__btn voice-card__btn--use">
                                        Sử dụng
                                    </a>
                                </div>
                            </div>
                        ))}
                        {voices.length === 0 && <p className="history__empty">Không tìm thấy voices.</p>}
                    </div>
                </div>
            </main>
        </>
    );
}
