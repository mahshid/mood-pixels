import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "../../styles/globals.css";

const geist = Geist({
    subsets: ["latin"],
    variable: "--font-geist",
    display: "swap",
});

export const metadata: Metadata = {
    title: "Mood Pixels",
    description: "Track your mood throughout the day",
    icons: {
        icon: "/favicon.ico?v=2",
    },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
    return (
        <html lang="en" className={`${geist.variable} h-full antialiased`}>
            <meta
                name="viewport"
                content="width=device-width, initial-scale=1.0"
            />
            <body>{children}</body>
        </html>
    );
}
