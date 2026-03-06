"use client";

import { useState } from "react";
import TextInput from "@/components/TextInput";
import VoiceSelector from "@/components/VoiceSelector";
import AudioPlayer from "@/components/AudioPlayer";
import SpeedControl from "@/components/SpeedControl";
import PitchControl from "@/components/PitchControl";
import PronunciationGuide from "@/components/PronunciationGuide";
import Navbar from "@/components/Navbar";
import { synthesize, type TTSResponse } from "@/lib/api";

const DEFAULT_VOICES: Record<string, string> = {
    vi: "vi-VN-HoaiMyNeural",
    en: "en-US-JennyNeural",
};

export default function StudioPage() {
    const [text, setText] = useState("");
    const [language, setLanguage] = useState<"vi" | "en">("vi");
    const [voiceId, setVoiceId] = useState(DEFAULT_VOICES.vi);
    const [speed, setSpeed] = useState(1.0);
    const [pitch, setPitch] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [result, setResult] = useState<TTSResponse | null>(null);

    const handleSynthesize = async () => {
        if (!text.trim()) return;
        setLoading(true);
        setError("");
        setResult(null);

        try {
            const res = await synthesize({
                text: text.trim(),
                language,
                voice_id: voiceId,
                speed,
                pitch,
                format: "mp3",
                engine: "auto",
            });
            setResult(res);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Có lỗi xảy ra");
        } finally {
            setLoading(false);
        }
    };

    const handleLanguageChange = (lang: "vi" | "en") => {
        setLanguage(lang);
        setVoiceId(DEFAULT_VOICES[lang]);
    };

    return (
        <>
            <Navbar />
            <main className="studio">
                <div className="studio__container">
                    <header className="studio__header">
                        <h1 className="studio__title">
                            <span className="studio__logo">🎙️</span> VoiceSensei
                        </h1>
                        <p className="studio__subtitle">Text-to-Speech cho học ngôn ngữ</p>
                    </header>

                    <section className="studio__input-section">
                        <TextInput
                            text={text}
                            setText={setText}
                            language={language}
                            setLanguage={handleLanguageChange}
                        />

                        {/* Pronunciation Guide */}
                        <PronunciationGuide text={text} language={language} />

                        <div className="studio__controls">
                            <VoiceSelector language={language} voiceId={voiceId} setVoiceId={setVoiceId} />
                            <SpeedControl speed={speed} setSpeed={setSpeed} />
                            <PitchControl pitch={pitch} setPitch={setPitch} />
                        </div>

                        <button
                            className="studio__convert-btn"
                            onClick={handleSynthesize}
                            disabled={loading || !text.trim()}
                        >
                            {loading ? (
                                <span className="studio__convert-btn-loading">
                                    <span className="spinner" /> Đang chuyển đổi...
                                </span>
                            ) : (
                                "🔊 Chuyển đổi"
                            )}
                        </button>

                        {error && <p className="studio__error">❌ {error}</p>}
                    </section>

                    <section className="studio__player-section">
                        <AudioPlayer
                            audioUrl={result?.audio_url || null}
                            wordTimestamps={result?.word_timestamps}
                        />
                    </section>
                </div>
            </main>
        </>
    );
}
