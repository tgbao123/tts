import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="landing">
      <section className="hero">
        <nav className="hero__nav">
          <span className="navbar__brand">🎙️ VoiceSensei</span>
          <div className="hero__nav-links">
            <Link href="/studio" className="hero__nav-link">Studio</Link>
            <Link href="/studio" className="hero__cta-sm">Bắt đầu miễn phí →</Link>
          </div>
        </nav>
        <div className="hero__content">
          <h1 className="hero__title">
            Biến <span className="hero__accent">Text</span> thành <span className="hero__accent">Giọng nói</span>
            <br />cho việc học ngôn ngữ
          </h1>
          <p className="hero__desc">
            Hỗ trợ 🇻🇳 Tiếng Việt · 🇬🇧 English — với phiên âm IPA, thanh điệu
          </p>
          <div className="hero__actions">
            <Link href="/studio" className="hero__btn hero__btn--primary">🎙️ Thử ngay Studio</Link>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="footer__content">
          <span>🎙️ VoiceSensei © 2026</span>
          <div className="footer__links">
            <Link href="/studio">Studio</Link>
            <Link href="/voices">Voices</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
