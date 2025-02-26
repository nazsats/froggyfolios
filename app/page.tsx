"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import styles from "@/styles/home.module.css";
import formSideImage from "@/public/form-side.png";
import Confetti from "react-confetti";

export default function Home() {
  const [walletAddress, setWalletAddress] = useState("");
  const [result, setResult] = useState({ message: "", color: "#ffffff" });
  const [showPopup, setShowPopup] = useState(false);
  const [whitelistType, setWhitelistType] = useState(null); // "gtdFreeMint", "fcfsWL", or null

  const checkWhitelist = async () => {
    if (!walletAddress.trim()) {
      setResult({ message: "Please enter a wallet address", color: "#ffff00" });
      return;
    }

    // Check if address starts with "bc1p" (Taproot address)
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
      console.log("API Response:", data); // Debug log

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
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-gradient-to-br from-green-500 via-blue-500 via-purple-500 via-pink-500 to-yellow-500 relative font-sans">
      {/* Top Left Logo */}
      <div className="absolute top-6 left-6 flex items-center text-white text-2xl font-bold">
        <Image src="/logo.png" alt="Froggy Logo" width={30} height={30} className="ml-2" />
        <span>Froggy Folios</span>
      </div>

      {/* Main Content */}
      <div className="w-full max-w-5xl relative z-0">
        {/* Content Container */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative bg-gray-900 p-8 rounded-2xl shadow-2xl border border-gray-500 flex flex-col lg:flex-row mt-16 lg:mt-0 z-20"
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
            <h1 className="text-3xl font-bold text-white text-center mb-6 flex items-center">
              Whitelist Checker
              <Image src="/logo.png" alt="Logo" width={30} height={30} className="ml-2" />
            </h1>
            <div className="w-full max-w-md space-y-4">
              <motion.input
                type="text"
                placeholder="Enter Bitcoin Taproot address (bc1p...)"
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                className="w-full p-3 rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 border border-gray-700 transition-all duration-300"
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3 }}
              />
              <motion.button
                onClick={checkWhitelist}
                className="w-full py-3 rounded-lg bg-green-500 text-white font-semibold transition transform hover:scale-105 hover:shadow-lg hover:shadow-green-500/50 focus:outline-none"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Check Status
              </motion.button>
              {/* Apply Whitelist Button */}
              <motion.a
                href="/login"
                className="block w-full py-3 rounded-lg bg-blue-500 text-white font-semibold text-center transition transform hover:scale-105 hover:shadow-lg hover:shadow-blue-500/50 focus:outline-none"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Apply Whitelist
              </motion.a>
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
            // GTD Free Mint Popup (Eye-Catching)
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, type: "spring" }}
              className="max-w-md w-full p-8 bg-gradient-to-br from-yellow-300 via-green-400 to-blue-500 rounded-2xl shadow-2xl border border-yellow-500 relative overflow-hidden flex flex-col items-center justify-center"
            >
              <div className="absolute inset-0 bg-[url('/frog-pattern.png')] opacity-20 pointer-events-none" />
              <motion.div
                animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity, repeatType: "loop" }}
              >
                <CheckCircle2 className="text-white w-20 h-20 mb-4 drop-shadow-lg" />
              </motion.div>
              <motion.h3
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-3xl font-extrabold text-white mb-2 text-center drop-shadow-md"
              >
                Ribbit! VIP Status!
              </motion.h3>
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="text-white text-lg mb-4 text-center font-semibold drop-shadow-md"
              >
                You’re eligible for GTD Free Mint!
              </motion.p>
              <motion.button
                onClick={() => setShowPopup(false)}
                className="px-8 py-2 bg-yellow-500 text-black rounded-full font-semibold hover:bg-yellow-600 transition-all shadow-md hover:shadow-lg"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Close
              </motion.button>
              <Confetti recycle={false} numberOfPieces={300} colors={["#FFD700", "#00FF00", "#FFFFFF"]} />
            </motion.div>
          ) : whitelistType === "fcfsWL" ? (
            // FCFS WL Popup (Simpler Design)
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, type: "spring" }}
              className="max-w-md w-full p-8 bg-gradient-to-br from-gray-200 via-blue-100 to-gray-300 rounded-2xl shadow-2xl border border-gray-400 relative overflow-hidden flex flex-col items-center justify-center"
            >
              <div className="absolute inset-0 bg-[url('/frog-pattern.png')] opacity-10 pointer-events-none" />
              <motion.div
                animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.1, 1] }}
                transition={{ duration: 1.2, repeat: Infinity, repeatType: "loop" }}
              >
                <CheckCircle2 className="text-blue-500 w-16 h-16 mb-4" />
              </motion.div>
              <motion.h3
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-2xl font-bold text-gray-800 mb-2 text-center"
              >
                Ribbit! You’re In!
              </motion.h3>
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="text-gray-600 text-lg mb-4 text-center"
              >
                You’re eligible for FCFS Whitelist!
              </motion.p>
              <motion.button
                onClick={() => setShowPopup(false)}
                className="px-8 py-2 bg-blue-400 text-white rounded-full font-semibold hover:bg-blue-500 transition-all shadow-md hover:shadow-lg"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Close
              </motion.button>
              <Confetti recycle={false} numberOfPieces={100} colors={["#1E90FF", "#87CEEB"]} />
            </motion.div>
          ) : (
            // Failure Popup with Sad Emoji
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, type: "spring" }}
              className="max-w-md w-full p-8 bg-gradient-to-br from-red-100 via-white to-gray-100 rounded-2xl shadow-2xl border border-gray-200 relative overflow-hidden flex flex-col items-center justify-center"
            >
              <div className="absolute inset-0 bg-[url('/frog-pattern.png')] opacity-10 pointer-events-none" />
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 1, repeat: Infinity, repeatType: "loop" }}
              >
                <span className="text-6xl">😢</span>
              </motion.div>
              <h3 className="text-3xl font-bold text-gray-800 mb-2 text-center">Ribbit! Sorry!</h3>
              <p className="text-gray-600 text-lg mb-4 text-center">You’re not on the whitelist yet.</p>
              <motion.button
                onClick={handleTwitterFollow}
                className="px-8 py-2 bg-blue-500 text-white rounded-full font-semibold hover:bg-blue-600 transition-all shadow-md hover:shadow-lg flex items-center gap-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Image src="/x-logo.png" alt="X Logo" width={20} height={20} />
                Turn on Twitter Notifications
              </motion.button>
              <motion.button
                onClick={() => setShowPopup(false)}
                className="mt-4 px-8 py-2 bg-gray-200 text-gray-800 rounded-full font-semibold hover:bg-gray-300 transition-all shadow-md hover:shadow-lg"
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
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.8 }}
        className="absolute bottom-4 text-white text-sm"
      >
        © 2025 Froggy Folios
      </motion.p>
    </div>
  );
}