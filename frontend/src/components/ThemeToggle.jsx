// frontend/src/components/ThemeToggle.jsx
import React, { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem("theme") === "dark" || 
      (!localStorage.getItem("theme") && window.matchMedia("(prefers-color-scheme: dark)").matches);
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);

  return (
    <button
      onClick={() => setIsDark(!isDark)}
      className="btn btn-secondary animate-fade-in"
      style={{
        padding: "8px",
        borderRadius: "50%",
        width: "38px",
        height: "38px",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center"
      }}
      title={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
    >
      {isDark ? <Sun size={18} style={{ color: "var(--color-warning)" }} /> : <Moon size={18} style={{ color: "var(--color-primary)" }} />}
    </button>
  );
}
