"use client";

interface PitchControlProps {
    pitch: number;
    setPitch: (pitch: number) => void;
}

export default function PitchControl({ pitch, setPitch }: PitchControlProps) {
    const getPitchLabel = (p: number) => {
        if (p <= -5) return "Rất trầm";
        if (p < 0) return "Trầm";
        if (p === 0) return "Mặc định";
        if (p <= 5) return "Cao";
        return "Rất cao";
    };

    return (
        <div className="control-card">
            <label className="control-card__label">
                🎵 Cao độ: <strong>{pitch > 0 ? `+${pitch}` : pitch}Hz</strong>
                <span className="control-card__badge">{getPitchLabel(pitch)}</span>
            </label>
            <input
                type="range"
                className="control-slider"
                min={-10} max={10} step={1}
                value={pitch}
                onChange={(e) => setPitch(parseInt(e.target.value))}
            />
            <div className="control-slider__labels">
                <span>🔉 Trầm</span>
                <button className="control-preset control-preset--sm" onClick={() => setPitch(0)}>Reset</button>
                <span>🔊 Cao</span>
            </div>
        </div>
    );
}
