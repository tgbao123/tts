"use client";

import { useState, useEffect, useCallback } from "react";
import Navbar from "@/components/Navbar";
import AudioPlayer from "@/components/AudioPlayer";

const API_URL = process.env.NEXT_PUBLIC_API_URL || (typeof window !== "undefined" ? `http://${window.location.hostname}:7001` : "http://localhost:7001");

interface HistoryItem {
    id: string;
    input_text: string;
    language: string;
    voice_id: string;
    engine: string;
    speed: number;
    pitch: number;
    audio_path: string;
    char_count: number;
    duration_ms: number;
    status: string;
    is_favorite: boolean;
    created_at: string;
}

const LANG_FLAGS: Record<string, string> = { vi: "🇻🇳", en: "🇬🇧", ja: "🇯🇵" };

export default function HistoryPage() {
    const [items, setItems] = useState<HistoryItem[]>([]);
    const [filter, setFilter] = useState<string>("all");
    const [playingId, setPlayingId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchHistory = useCallback(async () => {
        setLoading(true);
        try {
            const lang = filter !== "all" ? `&language=${filter}` : "";
            const res = await fetch(`${API_URL}/api/v1/history?limit=50${lang}`);
            const data = await res.json();
            setItems(data.items);
        } catch {
            console.error("Failed to load history");
        } finally {
            setLoading(false);
        }
    }, [filter]);

    useEffect(() => { fetchHistory(); }, [fetchHistory]);

    const handleDelete = async (id: string) => {
        await fetch(`${API_URL}/api/v1/history/${id}`, { method: "DELETE" });
        setItems((prev) => prev.filter((i) => i.id !== id));
        if (playingId === id) setPlayingId(null);
    };

    const handleToggleFav = async (id: string) => {
        const res = await fetch(`${API_URL}/api/v1/favorites/${id}`, { method: "POST" });
        const data = await res.json();
        setItems((prev) =>
            prev.map((i) => (i.id === id ? { ...i, is_favorite: data.is_favorite } : i))
        );
    };

    return (
        <>
            <Navbar />
            <main className="history">
                <div className="history__container">
                    <header className="history__header">
                        <h1 className="history__title">📋 Lịch sử chuyển đổi</h1>
                        <p className="history__subtitle">{items.length} kết quả</p>
                    </header>

                    {/* Filters */}
                    <div className="history__filters">
                        {["all", "vi", "en", "ja"].map((lang) => (
                            <button
                                key={lang}
                                className={`history__filter ${filter === lang ? "history__filter--active" : ""}`}
                                onClick={() => setFilter(lang)}
                            >
                                {lang === "all" ? "🌐 Tất cả" : `${LANG_FLAGS[lang]} ${lang.toUpperCase()}`}
                            </button>
                        ))}
                    </div>

                    {/* List */}
                    {loading ? (
                        <p className="history__empty">Đang tải...</p>
                    ) : items.length === 0 ? (
                        <div className="history__empty">
                            <p>📭 Chưa có lịch sử.</p>
                            <p>Tạo TTS đầu tiên tại <a href="/studio">Studio</a></p>
                        </div>
                    ) : (
                        <div className="history__list">
                            {items.map((item) => (
                                <div key={item.id} className="history-card">
                                    <div className="history-card__header">
                                        <span className="history-card__lang">{LANG_FLAGS[item.language]} {item.language.toUpperCase()}</span>
                                        <span className="history-card__meta">
                                            {item.speed}x · {item.char_count} chars
                                        </span>
                                    </div>
                                    <p className="history-card__text">
                                        {item.input_text.length > 120
                                            ? item.input_text.slice(0, 120) + "..."
                                            : item.input_text}
                                    </p>

                                    {/* Mini player */}
                                    {playingId === item.id ? (
                                        <div className="history-card__player">
                                            <AudioPlayer audioUrl={item.audio_path} />
                                        </div>
                                    ) : null}

                                    <div className="history-card__actions">
                                        <button
                                            className="history-card__btn"
                                            onClick={() => setPlayingId(playingId === item.id ? null : item.id)}
                                            title={playingId === item.id ? "Ẩn player" : "Phát"}
                                        >
                                            {playingId === item.id ? "⏹" : "▶️"} Phát
                                        </button>
                                        <button
                                            className={`history-card__btn ${item.is_favorite ? "history-card__btn--fav" : ""}`}
                                            onClick={() => handleToggleFav(item.id)}
                                            title="Yêu thích"
                                        >
                                            {item.is_favorite ? "⭐" : "☆"} Thích
                                        </button>
                                        <button
                                            className="history-card__btn history-card__btn--danger"
                                            onClick={() => handleDelete(item.id)}
                                            title="Xóa"
                                        >
                                            🗑️ Xóa
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </>
    );
}
