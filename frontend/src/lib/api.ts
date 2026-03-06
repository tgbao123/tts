const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface TTSRequest {
    text: string;
    language: "vi" | "en" | "ja";
    voice_id: string;
    speed: number;
    pitch: number;
    format: string;
    engine: string;
}

export interface WordTimestamp {
    word: string;
    start: number;
    end: number;
}

export interface TTSResponse {
    id: string;
    status: string;
    audio_url: string;
    duration_ms: number;
    char_count: number;
    engine_used: string;
    word_timestamps: WordTimestamp[];
}

export interface Voice {
    id: string;
    name: string;
    language: string;
    gender: string;
}

export async function synthesize(request: TTSRequest): Promise<TTSResponse> {
    const res = await fetch(`${API_URL}/api/v1/tts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "TTS request failed" }));
        throw new Error(err.detail || "TTS request failed");
    }

    return res.json();
}

export async function listVoices(language?: string): Promise<{ voices: Voice[]; total: number }> {
    const url = language
        ? `${API_URL}/api/v1/voices?language=${language}`
        : `${API_URL}/api/v1/voices`;
    const res = await fetch(url);

    if (!res.ok) throw new Error("Failed to fetch voices");
    return res.json();
}

export function getFullAudioUrl(path: string): string {
    if (path.startsWith("http")) return path;
    return `${API_URL}${path}`;
}
