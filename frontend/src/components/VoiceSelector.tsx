"use client";

import { useEffect, useState } from "react";
import { listVoices, type Voice } from "@/lib/api";

interface VoiceSelectorProps {
    language: string;
    voiceId: string;
    setVoiceId: (id: string) => void;
}

export default function VoiceSelector({ language, voiceId, setVoiceId }: VoiceSelectorProps) {
    const [voices, setVoices] = useState<Voice[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setLoading(true);
        listVoices(language)
            .then((data) => {
                setVoices(data.voices);
                if (data.voices.length > 0 && !data.voices.find((v) => v.id === voiceId)) {
                    setVoiceId(data.voices[0].id);
                }
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [language]);

    const genderGroups = {
        Female: voices.filter((v) => v.gender === "Female"),
        Male: voices.filter((v) => v.gender === "Male"),
    };

    return (
        <div className="voice-selector">
            <label className="voice-selector__label">🎤 Giọng đọc</label>

            {loading ? (
                <p className="voice-selector__loading">Đang tải giọng...</p>
            ) : (
                <select
                    className="voice-selector__select"
                    value={voiceId}
                    onChange={(e) => setVoiceId(e.target.value)}
                >
                    {Object.entries(genderGroups).map(
                        ([gender, items]) =>
                            items.length > 0 && (
                                <optgroup key={gender} label={gender === "Female" ? "👩 Nữ" : "👨 Nam"}>
                                    {items.map((v) => (
                                        <option key={v.id} value={v.id}>
                                            {v.name.replace(/Microsoft\s*/i, "").replace(/\s*Online\s*\(Natural.*?\)/i, "")}
                                        </option>
                                    ))}
                                </optgroup>
                            )
                    )}
                </select>
            )}
        </div>
    );
}
