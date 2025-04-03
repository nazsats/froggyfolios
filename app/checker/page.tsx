"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import formSideImage from "@/public/form-side.png";
import Confetti from "react-confetti";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Checker() {
  const [walletAddress, setWalletAddress] = useState("");
  const [result, setResult] = useState({ message: "", color: "#ffffff" });
  const [showPopup, setShowPopup] = useState(false);
  const [whitelistType, setWhitelistType] = useState<string | null>(null);
  const [theme] = useState<"dark" | "light">("dark"); // Hardcoded for simplicity
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const pathname = usePathname(); // Get current route

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const checkWhitelist = async () => {
    if (!walletAddress.trim()) {
      setResult({ message: "Please enter a wallet address", color: "#ffff00" });
      return;
    }

    if (!walletAddress.startsWith("bc1p")) {
      setResult({ message: "Please enter a Bitcoin Taproot address (must start with 'bc1p')", color: "#ff0000" });
      return;
    }

    try {
      setResult({ message: "Checking...", color: "#ffffff" });
      const response = await fetch("/api/checkWhitelist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: walletAddress }),
      });
      const data = await response.json();

      if (data.success) {
        setResult({ message: "", color: "#ffffff" });
        setWhitelistType(data.whitelistType);
        setShowPopup(true);
      } else {
        setResult({ message: "", color: "#ffffff" });
        setWhitelistType(null);
        setShowPopup(true);
      }
    } catch (error) {
      setResult({ message: "Error checking whitelist status", color: "#ff0000" });
      console.error("Error:", error);
    }
  };

  const handleTwitterFollow = () => {
    window.open("https://twitter.com/intent/follow?screen_name=FroggyFolios", "_blank");
  };

  return (
    <div
      className={`min-h-screen flex flex-col ${
        theme === "dark"
          ? "bg-gradient-to-br from-green-800 via-blue-800 to-purple-800 text-white"
          : "bg-gradient-to-br from-green-300 via-blue-300 to-purple-300 text-gray-900"
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
              className={`text-lg font-semibold px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors ${
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
            onClick={() => {} /* Theme toggle disabled since theme is hardcoded */}
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
              onClick={() => {} /* Theme toggle disabled */}
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
      <div className="w-full max-w-5xl mx-auto flex-grow flex items-center justify-center py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className={`w-full ${
            theme === "dark" ? "bg-gray-800/80 border-gray-700" : "bg-white/80 border-gray-200"
          } p-8 rounded-2xl shadow-2xl border flex flex-col lg:flex-row`}
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
            <h1 className="text-3xl font-bold text-center mb-6 flex items-center">
              Whitelist Checker
              <Image src="/logo.png" alt="Logo" width={30} height={30} className="ml-2" />
            </h1>
            <div className="w-full max-w-md space-y-4">
              <motion.input
                type="text"
                placeholder="Enter Bitcoin Taproot address (bc1p...)"
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                className={`w-full p-3 rounded-lg ${
                  theme === "dark"
                    ? "bg-gray-700 text-white border-gray-600 placeholder-gray-400"
                    : "bg-gray-200 text-gray-900 border-gray-300 placeholder-gray-500"
                } focus:outline-none focus:ring-2 focus:ring-blue-400`}
              />
              <motion.button
                onClick={checkWhitelist}
                className={`w-full py-3 rounded-lg ${
                  theme === "dark"
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-green-500 hover:bg-green-600"
                } text-white font-semibold`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Check Status
              </motion.button>
            </div>
            <motion.div
              className="mt-4 text-center"
              style={{ color: result.color }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              {result.message}
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Popup for Whitelist Result */}
      {showPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm z-50">
          {whitelistType === "gtdFreeMint" ? (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, type: "spring" }}
              className={`max-w-md w-full p-8 ${
                theme === "dark"
                  ? "bg-gradient-to-br from-yellow-700 via-green-700 to-blue-700"
                  : "bg-gradient-to-br from-yellow-300 via-green-300 to-blue-300"
              } rounded-2xl shadow-2xl border ${
                theme === "dark" ? "border-gray-700" : "border-gray-200"
              } relative overflow-hidden flex flex-col items-center justify-center`}
            >
              <div className="absolute inset-0 bg-[url('/frog-pattern.png')] opacity-20 pointer-events-none" />
              <motion.div
                animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity, repeatType: "loop" }}
              >
                <Image
                  src="/emojis/stareye.png"
                  alt="Stareye Frog"
                  width={300}
                  height={300}
                  className="drop-shadow-lg"
                />
              </motion.div>
              <motion.h3
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className={`text-3xl font-extrabold mb-2 text-center ${
                  theme === "dark" ? "text-white" : "text-gray-800"
                } drop-shadow-md`}
              >
                Ribbit! VIP Status!
              </motion.h3>
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className={`text-lg mb-4 text-center font-semibold ${
                  theme === "dark" ? "text-gray-200" : "text-gray-600"
                } drop-shadow-md`}
              >
                You’re eligible for GTD Free Mint!
              </motion.p>
              <motion.button
                onClick={() => setShowPopup(false)}
                className={`px-8 py-2 ${
                  theme === "dark"
                    ? "bg-yellow-600 hover:bg-yellow-700 text-black"
                    : "bg-yellow-400 hover:bg-yellow-500 text-black"
                } rounded-full font-semibold transition-all shadow-md hover:shadow-lg`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Close
              </motion.button>
              <Confetti
                recycle={false}
                numberOfPieces={300}
                colors={["#FFD700", "#00FF00", "#FFFFFF"]}
              />
            </motion.div>
          ) : whitelistType === "fcfsWL" ? (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, type: "spring" }}
              className={`max-w-md w-full p-8 ${
                theme === "dark"
                  ? "bg-gradient-to-br from-gray-700 via-blue-700 to-gray-700"
                  : "bg-gradient-to-br from-gray-200 via-blue-200 to-gray-200"
              } rounded-2xl shadow-2xl border ${
                theme === "dark" ? "border-gray-700" : "border-gray-200"
              } relative overflow-hidden flex flex-col items-center justify-center`}
            >
              <div className="absolute inset-0 bg-[url('/frog-pattern.png')] opacity-10 pointer-events-none" />
              <motion.div
                animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.1, 1] }}
                transition={{ duration: 1.2, repeat: Infinity, repeatType: "loop" }}
              >
                <Image
                  src="/emojis/stareye.png"
                  alt="Stareye Frog"
                  width={300}
                  height={300}
                  className="drop-shadow-lg"
                />
              </motion.div>
              <motion.h3
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className={`text-2xl font-bold mb-2 text-center ${
                  theme === "dark" ? "text-white" : "text-gray-800"
                }`}
              >
                Ribbit! You’re In!
              </motion.h3>
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className={`text-lg mb-4 text-center ${
                  theme === "dark" ? "text-gray-200" : "text-gray-600"
                }`}
              >
                You’re eligible for FCFS Whitelist!
              </motion.p>
              <motion.button
                onClick={() => setShowPopup(false)}
                className={`px-8 py-2 ${
                  theme === "dark" ? "bg-blue-600 hover:bg-blue-700" : "bg-blue-500 hover:bg-blue-600"
                } text-white rounded-full font-semibold transition-all shadow-md hover:shadow-lg`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Close
              </motion.button>
              <Confetti recycle={false} numberOfPieces={100} colors={["#1E90FF", "#87CEEB"]} />
            </motion.div>
          ) : (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, type: "spring" }}
              className={`max-w-md w-full p-8 ${
                theme === "dark"
                  ? "bg-gradient-to-br from-red-700 via-gray-800 to-gray-700"
                  : "bg-gradient-to-br from-red-100 via-white to-gray-100"
              } rounded-2xl shadow-2xl border ${
                theme === "dark" ? "border-gray-700" : "border-gray-200"
              } relative overflow-hidden flex flex-col items-center justify-center`}
            >
              <div className="absolute inset-0 bg-[url('/frog-pattern.png')] opacity-10 pointer-events-none" />
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 1, repeat: Infinity, repeatType: "loop" }}
              >
                <Image
                  src="/emojis/cry.png"
                  alt="Cry Frog"
                  width={300}
                  height={300}
                  className="drop-shadow-lg"
                />
              </motion.div>
              <h3
                className={`text-3xl font-bold mb-2 text-center ${
                  theme === "dark" ? "text-white" : "text-gray-800"
                }`}
              >
                Ribbit! Sorry!
              </h3>
              <p
                className={`text-lg mb-4 text-center ${
                  theme === "dark" ? "text-gray-200" : "text-gray-600"
                }`}
              >
                You’re not on the whitelist yet.
              </p>
              <motion.button
                onClick={handleTwitterFollow}
                className={`px-8 py-2 ${
                  theme === "dark" ? "bg-blue-600 hover:bg-blue-700" : "bg-blue-500 hover:bg-blue-600"
                } text-white rounded-full font-semibold transition-all shadow-md hover:shadow-lg flex items-center gap-2`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Image src="/x-logo.png" alt="X Logo" width={20} height={20} />
                Turn on Twitter Notifications
              </motion.button>
              <motion.button
                onClick={() => setShowPopup(false)}
                className={`mt-4 px-8 py-2 ${
                  theme === "dark"
                    ? "bg-gray-600 hover:bg-gray-700 text-white"
                    : "bg-gray-200 hover:bg-gray-300 text-gray-800"
                } rounded-full font-semibold transition-all shadow-md hover:shadow-lg`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Close
              </motion.button>
            </motion.div>
          )}
        </div>
      )}

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