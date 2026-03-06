import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin", "vietnamese"] });

export const metadata: Metadata = {
  title: "VoiceSensei — Text-to-Speech cho học ngôn ngữ",
  description: "Chuyển đổi văn bản thành giọng nói hỗ trợ tiếng Việt, Anh, Nhật. Dành cho dạy và học ngôn ngữ.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
