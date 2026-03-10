import type { Metadata } from "next";
import { JetBrains_Mono, Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import "./globals.css";
import Providers from "@/components/Providers";

const jetbrainsMono = JetBrains_Mono({
    subsets: ["latin"],
    weight: ["400", "700"],
    variable: '--font-mono',
});

const inter = Inter({
    subsets: ["latin"],
    weight: ["400", "600"],
    variable: '--font-sans',
});

export const metadata: Metadata = {
    title: "Pulse | Sentiment Intelligence Platform",
    description: "Production-grade, AI-powered sentiment analysis platform.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <ClerkProvider appearance={{ baseTheme: dark, variables: { colorPrimary: '#4F46E5', colorBackground: '#0e0e1a', colorText: '#F1F0FF' } }}>
            <html lang="en" className={`${jetbrainsMono.variable} ${inter.variable}`}>
                <body className="antialiased min-h-screen text-[var(--text-primary)]">
                    <Providers>
                        {children}
                    </Providers>
                </body>
            </html>
        </ClerkProvider>
    );
}
