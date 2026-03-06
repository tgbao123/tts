"use client";

import Navbar from "@/components/Navbar";

export default function ApiDocsPage() {
    return (
        <>
            <Navbar />
            <main className="docs">
                <div className="docs__container">
                    <header className="gallery__header">
                        <h1 className="gallery__title">📚 API Documentation</h1>
                        <p className="gallery__subtitle">Tích hợp VoiceSensei vào ứng dụng của bạn</p>
                    </header>

                    {/* Getting Started */}
                    <section className="docs__section">
                        <h2 className="docs__heading">🚀 Getting Started</h2>
                        <div className="docs__card">
                            <p>Base URL: <code>http://localhost:8000/api/v1</code></p>
                            <p>Swagger UI: <a href="http://localhost:8000/docs" target="_blank" rel="noopener">http://localhost:8000/docs</a></p>
                        </div>
                    </section>

                    {/* Auth */}
                    <section className="docs__section">
                        <h2 className="docs__heading">🔐 Authentication</h2>
                        <div className="docs__card">
                            <pre className="docs__code">{`# API Key
curl -H "X-API-Key: vs_live_abc..." \\
  http://localhost:8000/api/v1/tts`}</pre>
                        </div>
                    </section>

                    {/* Endpoints */}
                    <section className="docs__section">
                        <h2 className="docs__heading">📡 Endpoints</h2>

                        <div className="docs__endpoint">
                            <div className="docs__method docs__method--post">POST</div>
                            <code>/api/v1/tts</code>
                            <span className="docs__desc">Text-to-Speech conversion</span>
                        </div>
                        <div className="docs__card">
                            <pre className="docs__code">{`curl -X POST http://localhost:8000/api/v1/tts \\
  -H "Content-Type: application/json" \\
  -d '{
    "text": "Hello world",
    "language": "en",
    "voice_id": "en-US-JennyNeural",
    "speed": 1.0,
    "pitch": 0
  }'`}</pre>
                        </div>

                        <div className="docs__endpoint">
                            <div className="docs__method docs__method--get">GET</div>
                            <code>/api/v1/voices</code>
                            <span className="docs__desc">List available voices</span>
                        </div>
                        <div className="docs__card">
                            <pre className="docs__code">{`curl "http://localhost:8000/api/v1/voices?language=vi"

# Response:
{
  "voices": [
    { "id": "vi-VN-HoaiMyNeural", "name": "HoaiMy", "gender": "Female" }
  ],
  "total": 2
}`}</pre>
                        </div>

                        <div className="docs__endpoint">
                            <div className="docs__method docs__method--post">POST</div>
                            <code>/api/v1/pronunciation</code>
                            <span className="docs__desc">Get IPA / Romaji / tone analysis</span>
                        </div>

                        <div className="docs__endpoint">
                            <div className="docs__method docs__method--post">POST</div>
                            <code>/api/v1/tts/batch</code>
                            <span className="docs__desc">Batch file conversion</span>
                        </div>

                        <div className="docs__endpoint">
                            <div className="docs__method docs__method--get">GET</div>
                            <code>/api/v1/history</code>
                            <span className="docs__desc">List TTS history</span>
                        </div>

                        <div className="docs__endpoint">
                            <div className="docs__method docs__method--get">GET</div>
                            <code>/api/v1/voices/gallery</code>
                            <span className="docs__desc">Voice gallery</span>
                        </div>
                    </section>

                    {/* Rate Limits */}
                    <section className="docs__section">
                        <h2 className="docs__heading">⚡ Rate Limits</h2>
                        <div className="docs__card">
                            <table className="docs__table">
                                <thead>
                                    <tr><th>Tier</th><th>Requests/ngày</th><th>Voice Clone</th><th>Engine</th></tr>
                                </thead>
                                <tbody>
                                    <tr><td>Free</td><td>50</td><td>❌</td><td>Edge TTS</td></tr>
                                    <tr><td>Pro</td><td>Unlimited</td><td>✅ 5</td><td>Fish Speech</td></tr>
                                    <tr><td>Enterprise</td><td>Unlimited</td><td>✅ ∞</td><td>Google Cloud</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </section>

                    {/* SDKs */}
                    <section className="docs__section">
                        <h2 className="docs__heading">💻 SDK Examples</h2>
                        <div className="docs__card">
                            <h3>Python</h3>
                            <pre className="docs__code">{`import requests

response = requests.post(
    "http://localhost:8000/api/v1/tts",
    json={"text": "Xin chào", "language": "vi"},
    headers={"X-API-Key": "vs_live_..."}
)
audio_url = response.json()["audio_url"]`}</pre>
                        </div>
                        <div className="docs__card">
                            <h3>JavaScript</h3>
                            <pre className="docs__code">{`const res = await fetch("/api/v1/tts", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-API-Key": "vs_live_..."
  },
  body: JSON.stringify({
    text: "Hello", language: "en"
  })
});
const { audio_url } = await res.json();`}</pre>
                        </div>
                    </section>
                </div>
            </main>
        </>
    );
}
