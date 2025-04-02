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

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "dark" | "light" | null;
    setTheme(savedTheme || "dark");
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
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
      <nav className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-purple-800 to-pink-800 shadow-lg">
        <div className="flex items-center space-x-2">
          <Image
            src="/logo.png"
            alt="Froggy Logo"
            width={40}
            height={40}
            className="rounded-full"
          />
          <span className="text-2xl font-extrabold tracking-tight">Froggy Folios</span>
        </div>
        <div className="flex items-center space-x-6">
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
          <Link href="/leaderboard">
            <motion.span
              className="text-lg font-semibold px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Leaderboard
            </motion.span>
          </Link>
          <motion.button
            onClick={toggleTheme}
            className={`p-2 rounded-full ${
              theme === "dark" ? "bg-gray-700 text-yellow-400" : "bg-gray-200 text-gray-700"
            } shadow-md`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            {theme === "dark" ? "☀️ Light" : "🌙 Dark"}
          </motion.button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex flex-col md:flex-row flex-grow px-6 py-8 space-y-6 md:space-y-0 md:space-x-6">
        {/* Left Side: Enhanced Leaderboard */}
        <div className="md:w-1/3">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className={`p-6 rounded-lg shadow-lg ${
              theme === "dark" ? "bg-gray-800/90" : "bg-white/90"
            } border border-purple-500/50`}
          >
            <h2 className="text-2xl font-bold mb-4 flex items-center">
              <span className="mr-2">🏆</span> Leaderboard
            </h2>
            <div className="space-y-3">
              {leaderboard.slice(0, 5).map((entry) => (
                <div
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
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-semibold">{getRankDisplay(entry.rank)}</span>
                    <span>{entry.address.slice(0, 6)}...</span>
                  </div>
                  <span className="text-lg font-bold text-green-400">{entry.points}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Right Side: Game Containers */}
        <div className="md:w-2/3 flex flex-col space-y-6">
          <div className="flex flex-col md:flex-row space-y-6 md:space-y-0 md:space-x-6">
            {/* Game 1: Froggy Food Chain */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className={`flex-1 p-6 rounded-lg shadow-lg text-center relative overflow-hidden ${
                theme === "dark" ? "bg-gray-800/90" : "bg-white/90"
              } border border-purple-500/50 hover:border-purple-400 transition-colors`}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 pointer-events-none" />
              <Image
                src="/emojis/stareye.png"
                alt="Froggy Food Chain"
                width={200}
                height={200}
                className="mx-auto mb-4"
              />
              <h3 className="text-2xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                Froggy Food Chain
              </h3>
              <Link href="/game">
                <motion.button
                  className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-full text-lg font-semibold shadow-lg"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Play Now
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
              } border border-purple-500/50 hover:border-purple-400 transition-colors`}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 pointer-events-none" />
              <Image
                src="/emojis/stareye.png"
                alt="Froggy Shelf"
                width={200}
                height={200}
                className="mx-auto mb-4"
              />
              <h3 className="text-2xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                Froggy Shelf
              </h3>
              <Link href="/game2">
                <motion.button
                  className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-full text-lg font-semibold shadow-lg"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Play Now
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
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <span className="mr-2">🌐</span> Online Now
            </h3>
            <div className="flex flex-wrap gap-4">
              {onlineUsers.map((user, index) => (
                <div
                  key={index}
                  className={`flex items-center space-x-2 px-3 py-1 rounded-lg ${
                    theme === "dark" ? "bg-gray-700" : "bg-gray-200"
                  }`}
                >
                  <span className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></span>
                  <span>{user.icon}</span>
                  <span>{user.address}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}