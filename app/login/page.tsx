"use client";

import { signIn } from "next-auth/react";
import Image from "next/image";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import formSideImage from "@/public/form-side.png";

export default function Login() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const pathname = usePathname(); // Get current route

  // Load theme from local storage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "dark" | "light" | null;
    setTheme(savedTheme || "dark");
  }, []);

  // Save theme to local storage
  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLogin = () => {
    signIn("twitter", { callbackUrl: "/form" });
  };

  return (
    <div
      className={`min-h-screen flex flex-col ${
        theme === "dark"
          ? "bg-gradient-to-br from-pink-900 via-red-900 to-purple-900 text-white"
          : "bg-gradient-to-br from-pink-200 via-red-200 to-purple-200 text-gray-900"
      }`}
    >
      {/* Header */}
      <nav className="flex items-center justify-between px-4 py-3 md:py-4 bg-gradient-to-r from-purple-800 to-pink-800 shadow-lg">
        <Link href="/" className="flex items-center space-x-2">
          <Image
            src="/logo.png"
            alt="Froggy Logo"
            width={48}
            height={48}
            className="rounded-full"
          />
          <span className="text-2xl md:text-3xl font-extrabold tracking-tight">Froggy Folios</span>
        </Link>
        {/* Desktop Menu */}
        <div className="hidden md:flex items-center space-x-4">
          <Link href="/">
            <motion.span
              className={`text-lg font-semibold px-4 py-2 rounded-lg hover

:bg-purple-700 transition-colors ${
                pathname === "/" ? "underline text-yellow-400" : ""
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Home
            </motion.span>
          </Link>
          <Link href="/checker">
            <motion.span
              className={`text-lg font-semibold px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors ${
                pathname === "/checker" ? "underline text-yellow-400" : ""
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Check WL
            </motion.span>
          </Link>
          <Link href="/login">
            <motion.span
              className={`text-lg font-semibold px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors ${
                pathname === "/login" ? "underline text-yellow-400" : ""
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Apply for WL
            </motion.span>
          </Link>
          <motion.button
            onClick={toggleTheme}
            className={`p-3 rounded-full ${
              theme === "dark" ? "bg-gray-700 text-yellow-400" : "bg-gray-200 text-gray-700"
            } shadow-md text-lg`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            {theme === "dark" ? "☀️ Light" : "🌙 Dark"}
          </motion.button>
        </div>
        {/* Mobile Menu Toggle */}
        <div className="md:hidden">
          <motion.button
            onClick={toggleMenu}
            className="p-2 rounded-full text-white text-2xl"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            {isMenuOpen ? "✖" : "☰"}
          </motion.button>
        </div>
      </nav>
      {/* Mobile Menu Dropdown */}
      {isMenuOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="md:hidden bg-gradient-to-r from-purple-800 to-pink-800 px-4 py-2"
        >
          <div className="flex flex-col space-y-2">
            <Link href="/" onClick={toggleMenu}>
              <span
                className={`text-lg font-semibold px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors ${
                  pathname === "/" ? "underline text-yellow-400" : ""
                }`}
              >
                Home
              </span>
            </Link>
            <Link href="/checker" onClick={toggleMenu}>
              <span
                className={`text-lg font-semibold px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors ${
                  pathname === "/checker" ? "underline text-yellow-400" : ""
                }`}
              >
                Check WL
              </span>
            </Link>
            <Link href="/login" onClick={toggleMenu}>
              <span
                className={`text-lg font-semibold px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors ${
                  pathname === "/login" ? "underline text-yellow-400" : ""
                }`}
              >
                Apply for WL
              </span>
            </Link>
            <motion.button
              onClick={toggleTheme}
              className={`p-3 rounded-full w-fit ${
                theme === "dark" ? "bg-gray-700 text-yellow-400" : "bg-gray-200 text-gray-700"
              } shadow-md text-lg`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              {theme === "dark" ? "☀️ Light" : "🌙 Dark"}
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* Main Content */}
      <div className="w-full max-w-5xl mx-auto flex-grow flex items-center justify-center py-12 px-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className={`w-full ${
            theme === "dark" ? "bg-gray-800/80 border-gray-700" : "bg-white/80 border-gray-200"
          } p-8 rounded-2xl shadow-2xl border flex flex-col md:flex-row backdrop-blur-sm`}
        >
          {/* Image visible on all screens */}
          <div className="w-full md:w-1/2 flex items-center justify-center mb-6 md:mb-0">
            <Image
              src={formSideImage}
              alt="Froggy Side"
              width={300} // Reduced size for mobile
              height={300}
              className="w-full h-auto object-cover max-w-[300px] md:max-w-[500px]"
            />
          </div>

          {/* Login Form */}
          <div className="w-full md:w-1/2 flex flex-col justify-center items-center">
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-4xl font-bold mb-6 flex items-center"
            >
              Login
              <Image src="/logo.png" alt="Logo" width={40} height={40} className="ml-2" />
            </motion.h1>

            <motion.button
              onClick={handleLogin}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className={`w-full max-w-xs py-3 rounded-lg ${
                theme === "dark"
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "bg-blue-500 hover:bg-blue-600"
              } text-white font-semibold transition transform hover:scale-105 hover:shadow-lg focus:outline-none flex items-center justify-center gap-2`}
            >
              <Image src="/x-logo.png" alt="X Logo" width={24} height={24} />
              Login with Twitter
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="mt-auto px-4 py-4 bg-gradient-to-r from-purple-800 to-pink-800 text-center">
        <div className="flex flex-col items-center space-y-2">
          <Link href="https://x.com/froggyfolios" target="_blank" rel="noopener noreferrer">
            <motion.span
              className="text-2xl"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              𝕏
            </motion.span>
          </Link>
          <p className="text-sm md:text-base">Powered by Froggy Folios</p>
        </div>
      </footer>
    </div>
  );
}