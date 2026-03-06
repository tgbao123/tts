"use client";

import { useRef, useState, useEffect } from "react";
import { getFullAudioUrl, type WordTimestamp } from "@/lib/api";

interface AudioPlayerProps {
    audioUrl: string | null;
    wordTimestamps?: WordTimestamp[];
}

export default function AudioPlayer({ audioUrl, wordTimestamps = [] }: AudioPlayerProps) {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [activeWordIndex, setActiveWordIndex] = useState(-1);

    useEffect(() => {
        setIsPlaying(false);
        setCurrentTime(0);
        setActiveWordIndex(-1);
    }, [audioUrl]);

    useEffect(() => {
        if (!wordTimestamps.length) return;
        const idx = wordTimestamps.findIndex(
            (w) => currentTime * 1000 >= w.start && currentTime * 1000 < w.end
        );
        setActiveWordIndex(idx);
    }, [currentTime, wordTimestamps]);

    const togglePlay = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    const handleDownload = () => {
        if (!audioUrl) return;
        const a = document.createElement("a");
        a.href = getFullAudioUrl(audioUrl);
        a.download = `voicesensei_${Date.now()}.mp3`;
        a.click();
    };

    const formatTime = (s: number) => {
        const m = Math.floor(s / 60);
        const sec = Math.floor(s % 60);
        return `${m}:${sec.toString().padStart(2, "0")}`;
    };

    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

    if (!audioUrl) {
        return (
            <div className="audio-player audio-player--empty">
                <div className="audio-player__placeholder">
                    <span className="audio-player__icon">🔇</span>
                    <p>Nhập text và nhấn &quot;Chuyển đổi&quot; để nghe</p>
                </div>
            </div>
        );
    }

    return (
        <div className="audio-player">
            <audio
                ref={audioRef}
                src={getFullAudioUrl(audioUrl)}
                onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
                onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
                onEnded={() => {
                    setIsPlaying(false);
                    setActiveWordIndex(-1);
                }}
            />

            {/* Word Highlights */}
            {wordTimestamps.length > 0 && (
                <div className="audio-player__words">
                    {wordTimestamps.map((w, i) => (
                        <span
                            key={i}
                            className={`audio-player__word ${i === activeWordIndex ? "audio-player__word--active" : ""}`}
                            onClick={() => {
                                if (audioRef.current) {
                                    audioRef.current.currentTime = w.start / 1000;
                                    if (!isPlaying) {
                                        audioRef.current.play();
                                        setIsPlaying(true);
                                    }
                                }
                            }}
                        >
                            {w.word}
                        </span>
                    ))}
                </div>
            )}

            {/* Controls */}
            <div className="audio-player__controls">
                <button onClick={togglePlay} className="audio-player__play-btn" title={isPlaying ? "Pause" : "Play"}>
                    {isPlaying ? "⏸" : "▶️"}
                </button>

                <div className="audio-player__progress-wrap">
                    <div className="audio-player__progress-bar">
                        <div className="audio-player__progress-fill" style={{ width: `${progress}%` }} />
                    </div>
                    <span className="audio-player__time">
                        {formatTime(currentTime)} / {formatTime(duration)}
                    </span>
                </div>

                <button onClick={handleDownload} className="audio-player__download-btn" title="Download MP3">
                    ⬇️
                </button>
            </div>
        </div>
    );
}
