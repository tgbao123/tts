"use client";

interface TextInputProps {
    text: string;
    setText: (text: string) => void;
    language: "vi" | "en";
    setLanguage: (lang: "vi" | "en") => void;
    maxLength?: number;
}

const LANGUAGES = [
    { code: "vi" as const, label: "🇻🇳 Tiếng Việt", placeholder: "Nhập văn bản tiếng Việt..." },
    { code: "en" as const, label: "🇬🇧 English", placeholder: "Enter English text..." },
];

export default function TextInput({
    text,
    setText,
    language,
    setLanguage,
    maxLength = 5000,
}: TextInputProps) {
    const currentLang = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

    return (
        <div className="text-input">
            {/* Language Tabs */}
            <div className="text-input__tabs">
                {LANGUAGES.map((lang) => (
                    <button
                        key={lang.code}
                        className={`text-input__tab ${language === lang.code ? "text-input__tab--active" : ""}`}
                        onClick={() => setLanguage(lang.code)}
                    >
                        {lang.label}
                    </button>
                ))}
            </div>

            {/* Textarea */}
            <textarea
                className="text-input__textarea"
                value={text}
                onChange={(e) => setText(e.target.value.slice(0, maxLength))}
                placeholder={currentLang.placeholder}
                rows={6}
            />

            {/* Character count */}
            <div className="text-input__footer">
                <span className={`text-input__count ${text.length >= maxLength ? "text-input__count--limit" : ""}`}>
                    {text.length.toLocaleString()} / {maxLength.toLocaleString()}
                </span>
            </div>
        </div>
    );
}
