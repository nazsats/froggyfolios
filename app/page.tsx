"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabase = createClient(
  "https://taiyharwcaiumvqqxpml.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhaXloYXJ3Y2FpdW12cXF4cG1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAyOTg3MDIsImV4cCI6MjA1NTg3NDcwMn0.pccfqBA7pjPBt3HBgcTV9YoLs48R2lbNk1tRvdd5WsQ"
);

interface LeaderboardEntry {
  rank: number;
  address: string;
  points: number;
}

export default function Home() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "dark" | "light" | null;
    setTheme(savedTheme || "dark");
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Fetch leaderboard data
  const fetchLeaderboard = useCallback(async () => {
    try {
      const { data: game1Data, error: game1Error } = await supabase
        .from("game_users")
        .select("address, points");

      if (game1Error) throw game1Error;

      const { data: game2Data, error: game2Error } = await supabase
        .from("player_scores")
        .select("wallet_address, total_score");

      if (game2Error) throw game2Error;

      const combinedScores: { [address: string]: number } = {};
      game1Data.forEach((entry) => {
        combinedScores[entry.address] = (combinedScores[entry.address] || 0) + entry.points;
      });
      game2Data.forEach((entry) => {
        const address = entry.wallet_address;
        combinedScores[address] = (combinedScores[address] || 0) + entry.total_score;
      });

      const rankedData = Object.entries(combinedScores)
        .map(([address, points], index) => ({
          rank: index + 1,
          address,
          points,
        }))
        .sort((a, b) => b.points - a.points)
        .map((entry, index) => ({ ...entry, rank: index + 1 }));

      setLeaderboard(rankedData);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      setLeaderboard([]);
    }
  }, []);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const getRankDisplay = (rank: number) => {
    let medal = "";
    if (rank === 1) medal = " 🥇";
    else if (rank === 2) medal = " 🥈";
    else if (rank === 3) medal = " 🥉";
    return `${rank}${medal}`;
  };

  // Dummy data for "Online" section
  const onlineUsers = [
    { address: "bc1p...ajjas", icon: "🎮" },
    { address: "bc1p...kldf2", icon: "🕹️" },
    { address: "bc1p...9mnpq", icon: "👾" },
    { address: "bc1p...zxcvb", icon: "🎲" },
    { address: "bc1p...qwert", icon: "🧩" },
  ];

  return (
    <div
      className={`min-h-screen flex flex-col ${
        theme === "dark"
          ? "bg-gradient-to-br from-pink-900 via-red-900 to-purple-900 text-white"
          : "bg-gradient-to-br from-pink-200 via-red-200 to-purple-200 text-gray-900"
      }`}
    >
      {/* Enhanced Header and Menu */}
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
              className="text-lg font-semibold px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Home
            </motion.span>
          </Link>
          <Link href="/checker">
            <motion.span
              className="text-lg font-semibold px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Check WL
            </motion.span>
          </Link>
          <Link href="/login">
            <motion.span
              className="text-lg font-semibold px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
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
              <span className="text-lg font-semibold px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors">
                Home
              </span>
            </Link>
            <Link href="/checker" onClick={toggleMenu}>
              <span className="text-lg font-semibold px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors">
                Check WL
              </span>
            </Link>
            <Link href="/login" onClick={toggleMenu}>
              <span className="text-lg font-semibold px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors">
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

      {/* Title Section with Froggy Theme */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="px-4 py-4 md:py-6 text-center"
      >
        <div className="flex flex-col md:flex-row items-center justify-center space-y-4 md:space-y-0 md:space-x-6">
          <Image
            src="/emojis/stareye.png"
            alt="Froggy Character"
            width={100}
            height={100}
            className="rounded-full border-4 border-purple-500/50 animate-bounce"
          />
          <div>
            <h1 className="text-3xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              Welcome to Froggy Folios!
            </h1>
            <p className="text-lg md:text-xl mt-2 opacity-80">
              Hop into the Fun – Play, Win, and Rise to the Top! 🐸
            </p>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="flex flex-col md:flex-row flex-grow px-4 py-4 md:py-6 space-y-4 md:space-y-0 md:space-x-16">
        {/* Mobile: Games First, Leaderboard Second */}
        <div className="w-full md:w-2/3 flex flex-col space-y-4 order-1 md:order-2">
          <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-8">
            {/* Game 1: Froggy Food Chain */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className={`flex-1 flex flex-col rounded-lg shadow-lg overflow-hidden border-4 border-purple-500/50 hover:border-purple-400 transition-colors aspect-square relative z-0`}
            >
              <div className="relative w-full h-full">
                <Image
                  src="/Game1.png"
                  alt="Froggy Food Chain"
                  layout="fill"
                  objectFit="cover"
                  objectPosition="top"
                  className="rounded-t-lg"
                />
                <div className="absolute inset-0 bg-black/30 pointer-events-none rounded-t-lg" />
              </div>
              <div className="p-4 bg-gray-800/90">
                <Link href="/foodchain">
                  <motion.button
                    className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-bold text-base md:text-lg rounded-lg shadow-lg border-2 border-green-400/50 hover:border-green-300/50 transition-all duration-300 animate-pulse-glow"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Play Now
                  </motion.button>
                </Link>
              </div>
            </motion.div>

            {/* Game 2: Froggy Shelf */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className={`flex-1 flex flex-col rounded-lg shadow-lg overflow-hidden border-4 border-purple-500/50 hover:border-purple-400 transition-colors aspect-square relative z-0`}
            >
              <div className="relative w-full h-full">
                <Image
                  src="/Game2.png"
                  alt="Froggy Shelf"
                  layout="fill"
                  objectFit="cover"
                  objectPosition="top"
                  className="rounded-t-lg"
                />
                <div className="absolute inset-0 bg-black/30 pointer-events-none rounded-t-lg" />
              </div>
              <div className="p-4 bg-gray-800/90">
                <Link href="/frogshelf">
                  <motion.button
                    className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-bold text-base md:text-lg rounded-lg shadow-lg border-2 border-green-400/50 hover:border-green-300/50 transition-all duration-300 animate-pulse-glow"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Play Now
                  </motion.button>
                </Link>
              </div>
            </motion.div>
          </div>

          {/* Enhanced Online Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className={`p-6 rounded-lg shadow-lg ${
              theme === "dark" ? "bg-gray-800/90" : "bg-white/90"
            } border border-purple-500/50 relative z-0`}
          >
            <h3 className="text-lg md:text-xl font-semibold mb-4 flex items-center">
              <span className="mr-2">🌐</span> Online Now
            </h3>
            <div className="flex flex-wrap gap-3">
              {onlineUsers.map((user, index) => (
                <div
                  key={index}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
                    theme === "dark" ? "bg-gray-700" : "bg-gray-200"
                  }`}
                >
                  <span className="w-4 h-4 bg-green-400 rounded-full animate-pulse"></span>
                  <span className="text-lg">{user.icon}</span>
                  <span className="text-sm md:text-base">{user.address}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Leaderboard: Last on Mobile, First on Desktop */}
        <div className="w-full md:w-1/3 order-2 md:order-1">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className={`p-6 rounded-lg shadow-lg ${
              theme === "dark" ? "bg-gray-800/90" : "bg-white/90"
            } border border-purple-500/50 relative z-0`}
          >
            <h2 className="text-lg md:text-xl font-bold mb-4 flex items-center">
              <span className="mr-2">🏆</span> Leaderboard
            </h2>
            <div className="space-y-3">
              {leaderboard.slice(0, 10).map((entry) => (
                <motion.div
                  key={entry.address}
                  className={`flex justify-between items-center p-3 rounded-lg ${
                    theme === "dark" ? "bg-gray-700/50" : "bg-gray-200/50"
                  } border-l-4 ${
                    entry.rank === 1
                      ? "border-yellow-400"
                      : entry.rank === 2
                      ? "border-gray-400"
                      : entry.rank === 3
                      ? "border-orange-400"
                      : "border-purple-500"
                  } cursor-pointer`}
                  whileHover={{
                    scale: 1.02,
                    backgroundColor: theme === "dark" ? "rgba(107, 33, 168, 0.3)" : "rgba(147, 51, 234, 0.2)",
                    transition: { duration: 0.2 },
                  }}
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-base md:text-lg font-semibold">{getRankDisplay(entry.rank)}</span>
                    <span className="text-sm md:text-base">{entry.address.slice(0, 4)}...{entry.address.slice(-4)}</span>
                  </div>
                  <span className="text-base md:text-lg font-bold text-green-400">{entry.points}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
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