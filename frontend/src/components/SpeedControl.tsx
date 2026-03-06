"use client";

interface SpeedControlProps {
    speed: number;
    setSpeed: (speed: number) => void;
}

const PRESETS = [
    { label: "Chậm", value: 0.5, icon: "🐢" },
    { label: "Bình thường", value: 1.0, icon: "🚶" },
    { label: "Nhanh", value: 1.5, icon: "🏃" },
];

export default function SpeedControl({ speed, setSpeed }: SpeedControlProps) {
    const getSpeedLabel = (s: number) => {
        if (s <= 0.6) return "Rất chậm";
        if (s <= 0.8) return "Chậm";
        if (s <= 1.1) return "Bình thường";
        if (s <= 1.5) return "Nhanh";
        return "Rất nhanh";
    };

    return (
        <div className="control-card">
            <label className="control-card__label">
                ⚡ Tốc độ: <strong>{speed}x</strong>
                <span className="control-card__badge">{getSpeedLabel(speed)}</span>
            </label>
            <input
                type="range"
                className="control-slider"
                min={0.5} max={2} step={0.1}
                value={speed}
                onChange={(e) => setSpeed(parseFloat(e.target.value))}
            />
            <div className="control-presets">
                {PRESETS.map((p) => (
                    <button
                        key={p.value}
                        className={`control-preset ${speed === p.value ? "control-preset--active" : ""}`}
                        onClick={() => setSpeed(p.value)}
                    >
                        {p.icon} {p.label}
                    </button>
                ))}
            </div>
        </div>
    );
}
