import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "BumpLogic — Metal Residue War Room",
  description:
    "Package-aware root cause recommendation engine for wafer-level packaging (WLP) and bumping defect excursions.",
  icons: {
    icon: [
      { url: "/BumpLogic.png", type: "image/png" },
    ],
    apple: [
      { url: "/BumpLogic.png", type: "image/png" },
    ],
    shortcut: ["/BumpLogic.png"],
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="scanlines bg-[#05070d] text-white antialiased">{children}</body>
    </html>
  );
}