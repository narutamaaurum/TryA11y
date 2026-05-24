import React from "react";
import { useTheme } from "../context/ThemeContext";

export default function AnimatedBackground() {
  const { theme } = useTheme();

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        overflow: "hidden",
        pointerEvents: "none",
      }}
    >
      {/* Gradient orbs */}
      <div style={{
        position: "absolute",
        width: "55vw", height: "55vw",
        top: "-15%", left: "-10%",
        background: "var(--orb-1)",
        borderRadius: "50%",
        animation: "orb-drift-1 22s ease-in-out infinite",
        filter: "blur(2px)",
      }} />
      <div style={{
        position: "absolute",
        width: "50vw", height: "50vw",
        top: "-10%", right: "-12%",
        background: "var(--orb-2)",
        borderRadius: "50%",
        animation: "orb-drift-2 28s ease-in-out infinite",
        filter: "blur(2px)",
      }} />
      <div style={{
        position: "absolute",
        width: "45vw", height: "45vw",
        bottom: "5%", left: "5%",
        background: "var(--orb-3)",
        borderRadius: "50%",
        animation: "orb-drift-3 32s ease-in-out infinite",
        filter: "blur(2px)",
      }} />
      <div style={{
        position: "absolute",
        width: "40vw", height: "40vw",
        bottom: "-10%", right: "5%",
        background: "var(--orb-4)",
        borderRadius: "50%",
        animation: "orb-drift-4 26s ease-in-out infinite",
        filter: "blur(2px)",
      }} />
      <div style={{
        position: "absolute",
        width: "35vw", height: "35vw",
        top: "40%", left: "35%",
        background: "var(--orb-5)",
        borderRadius: "50%",
        animation: "orb-drift-5 35s ease-in-out infinite",
        filter: "blur(2px)",
      }} />

      {/* Subtle noise/texture overlay */}
      <div style={{
        position: "absolute",
        inset: 0,
        background: theme === "dark"
          ? "radial-gradient(ellipse at 50% 0%, rgba(124,58,237,0.06) 0%, transparent 60%)"
          : "radial-gradient(ellipse at 50% 0%, rgba(124,58,237,0.04) 0%, transparent 60%)",
      }} />
    </div>
  );
}
