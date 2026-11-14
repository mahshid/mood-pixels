const faceStyles: Record<string, { fill: string; eyes: string; mouth: string }> = {
    Sparkly: { fill: "#d7e6ce", eyes: "M12 17h3v3h-3z M25 17h3v3h-3z", mouth: "M15 24v2h3v2h4v-2h3v-2" },
    Cozy: { fill: "#f8e7ac", eyes: "M11 20v-2h2v-1h2v1h2v2 M23 20v-2h2v-1h2v1h2v2", mouth: "M16 24v2h2v1h4v-1h2v-2" },
    Tired: { fill: "#dce8f3", eyes: "M11 17v3h2v1h2v-1h2v-3 M23 17v3h2v1h2v-1h2v-3", mouth: "M17 26h6" },
    Sad: { fill: "#e7dcf0", eyes: "M12 18h3v3h-3z M25 18h3v3h-3z", mouth: "M16 28v-2h2v-2h4v2h2v2" },
    Frustrated: { fill: "#f3c6ba", eyes: "M11 16l5 4-5 3 M29 16l-5 4 5 3", mouth: "M16 28v-2h2v-1h4v1h2v2" },
};
export default function MoodFace({ mood }: { mood: string }) {
    const face = faceStyles[mood] ?? faceStyles.Cozy;
    return <svg className="pixel-face" viewBox="0 0 40 40" aria-hidden="true" focusable="false">
        <path d="M10 3h20v3h5v5h3v18h-3v5h-5v3H10v-3H5v-5H2V11h3V6h5Z" fill={face.fill} stroke="#3e403a" strokeWidth="1.8" strokeLinejoin="miter" />
        <path d="M11 6h18" stroke="#fff" strokeOpacity=".65" strokeWidth="2" />
        <path d={face.eyes} fill={mood === "Sparkly" || mood === "Sad" ? "#3e403a" : "none"} stroke="#3e403a" strokeWidth="1.5" strokeLinejoin="round" />
        <path d={face.mouth} fill="none" stroke="#3e403a" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M8 24h5M27 24h5" stroke="#dc9c91" strokeWidth="2.5" strokeOpacity=".5" />
    </svg>;
}
