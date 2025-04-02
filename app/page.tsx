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
        <div className="flex items-center space-x-2">
          <Image
            src="/logo.png"
            alt="Froggy Logo"
            width={48}
            height={48}
            className="rounded-full"
          />
          <span className="text-2xl md:text-3xl font-extrabold tracking-tight">Froggy Folios</span>
        </div>
        {/* Desktop Menu */}
        <div className="hidden md:flex items-center space-x-4">
          <Link href="/">
            <motion.span
              className="text-lg font-semibold px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Dashboard
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
                Dashboard
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
      <div className="flex flex-col md:flex-row flex-grow px-4 py-4 md:py-6 space-y-4 md:space-y-0 md:space-x-12">
        {/* Mobile: Games First, Leaderboard Second */}
        <div className="w-full md:w-2/3 flex flex-col space-y-4 order-1 md:order-2">
          <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
            {/* Game 1: Froggy Food Chain */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className={`flex-1 p-6 rounded-lg shadow-lg text-center relative overflow-hidden ${
                theme === "dark" ? "bg-gray-800/90" : "bg-white/90"
              } border-2 border-purple-500/50 hover:border-purple-400 transition-colors`}
            >
              {/* Neon Border Effect */}
              <div className="absolute inset-0 border-4 border-transparent rounded-lg pointer-events-none animate-neon-glow">
                <div className="absolute inset-0 border-4 border-purple-500/30 rounded-lg blur-sm" />
              </div>
              {/* Background Gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 pointer-events-none" />
              {/* Floating Particles */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute w-2 h-2 bg-purple-400 rounded-full top-10 left-10 animate-float" />
                <div className="absolute w-3 h-3 bg-pink-400 rounded-full bottom-10 right-10 animate-float-delayed" />
              </div>
              <Image
                src="/emojis/stareye.png"
                alt="Froggy Food Chain"
                width={150}
                height={150}
                className="mx-auto mb-4"
              />
              <h3 className="text-xl md:text-2xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                Froggy Food Chain
              </h3>
              <Link href="/game">
                <motion.button
                  className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-full text-base md:text-lg font-semibold shadow-lg relative overflow-hidden"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span className="relative z-10">Play Now</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 opacity-0 hover:opacity-30 transition-opacity" />
                </motion.button>
              </Link>
            </motion.div>

            {/* Game 2: Froggy Shelf */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className={`flex-1 p-6 rounded-lg shadow-lg text-center relative overflow-hidden ${
                theme === "dark" ? "bg-gray-800/90" : "bg-white/90"
              } border-2 border-purple-500/50 hover:border-purple-400 transition-colors`}
            >
              {/* Neon Border Effect */}
              <div className="absolute inset-0 border-4 border-transparent rounded-lg pointer-events-none animate-neon-glow">
                <div className="absolute inset-0 border-4 border-purple-500/30 rounded-lg blur-sm" />
              </div>
              {/* Background Gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 pointer-events-none" />
              {/* Floating Particles */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute w-2 h-2 bg-purple-400 rounded-full top-10 left-10 animate-float" />
                <div className="absolute w-3 h-3 bg-pink-400 rounded-full bottom-10 right-10 animate-float-delayed" />
              </div>
              <Image
                src="/emojis/stareye.png"
                alt="Froggy Shelf"
                width={150}
                height={150}
                className="mx-auto mb-4"
              />
              <h3 className="text-xl md:text-2xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                Froggy Shelf
              </h3>
              <Link href="/game2">
                <motion.button
                  className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-full text-base md:text-lg font-semibold shadow-lg relative overflow-hidden"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span className="relative z-10">Play Now</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 opacity-0 hover:opacity-30 transition-opacity" />
                </motion.button>
              </Link>
            </motion.div>
          </div>

          {/* Enhanced Online Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className={`p-6 rounded-lg shadow-lg ${
              theme === "dark" ? "bg-gray-800/90" : "bg-white/90"
            } border border-purple-500/50`}
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
            } border border-purple-500/50`}
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
    </div>
  );
}