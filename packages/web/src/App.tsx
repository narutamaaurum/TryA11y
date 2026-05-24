import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import AnimatedBackground from "./components/AnimatedBackground";
import Home from "./pages/Home";
import { ThemeProvider } from "./context/ThemeContext";

export default function App(): React.ReactElement {
  return (
    <ThemeProvider>
      <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", position: "relative", background: "var(--bg-page)" }}>
        <AnimatedBackground />
        <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", minHeight: "100vh" }}>
          <Header />
          <main style={{ flex: 1 }}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </div>
    </ThemeProvider>
  );
}
