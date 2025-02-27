"use client";

import { signIn } from "next-auth/react";
import Image from "next/image";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import logo from "@/public/logo.png";
import formSideImage from "@/public/form-side.png";

export default function Login() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

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

  const handleLogin = () => {
    signIn("twitter", { callbackUrl: "/form" });
  };

  return (
    <div
      className={`min-h-screen flex flex-col items-center justify-center px-4 ${
        theme === "dark"
          ? "bg-gradient-to-br from-green-800 via-blue-800 via-purple-800 via-pink-800 to-yellow-800 text-white"
          : "bg-gradient-to-br from-green-300 via-blue-300 via-purple-300 via-pink-300 to-yellow-300 text-gray-900"
      }`}
    >
      {/* Top Left Logo */}
      <div className="absolute top-6 left-6 flex items-center text-2xl font-bold">
        <Image src={logo} alt="Froggy Logo" width={30} height={30} className="ml-2" />
        <span>Froggy Whitelist</span>
      </div>

      {/* Theme Toggle Button */}
      <div className="absolute top-6 right-6">
        <motion.button
          onClick={toggleTheme}
          className={`p-2 rounded-full ${
            theme === "dark" ? "bg-gray-700 text-yellow-400" : "bg-gray-200 text-gray-700"
          }`}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          {theme === "dark" ? "☀️ Light" : "🌙 Dark"}
        </motion.button>
      </div>

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={`w-full max-w-5xl ${
          theme === "dark" ? "bg-gray-800/80 border-gray-700" : "bg-white/80 border-gray-200"
        } p-8 rounded-2xl shadow-2xl border flex flex-col lg:flex-row backdrop-blur-sm`}
      >
        <div className="lg:w-1/2 hidden lg:flex items-center justify-center">
          <Image
            src={formSideImage}
            alt="Froggy Side"
            width={500}
            height={500}
            className="w-full h-auto object-cover"
          />
        </div>

        <div className="lg:w-1/2 w-full flex flex-col justify-center items-center">
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-4xl font-bold mb-6 flex items-center"
          >
            Login
            <Image src={logo} alt="Logo" width={40} height={40} className="ml-2" />
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

      {/* Footer */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="absolute bottom-4 text-sm"
      >
        © 2025 Froggy Folios
      </motion.p>
    </div>
  );
}