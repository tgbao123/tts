"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
    { href: "/studio", label: "🎙️ Studio" },
    { href: "/voices", label: "🎤 Voices" },
    { href: "/history", label: "📋 Lịch sử" },
];

export default function Navbar() {
    const pathname = usePathname();

    return (
        <nav className="navbar">
            <Link href="/" className="navbar__brand">
                🎙️ <span>VoiceSensei</span>
            </Link>
            <div className="navbar__links">
                {NAV_ITEMS.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`navbar__link ${pathname === item.href ? "navbar__link--active" : ""}`}
                    >
                        {item.label}
                    </Link>
                ))}
            </div>
        </nav>
    );
}
