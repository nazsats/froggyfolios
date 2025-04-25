"use client";

declare global {
  interface Window {
    magicEden?: {
      bitcoin: any;
    };
    unisat?: {
      requestAccounts: () => Promise<string[]>;
      getAccounts: () => Promise<string[]>;
      [key: string]: any;
    };
  }
}

import { useRef, useEffect, useState, useCallback } from "react";
import Modal from "react-modal";
import confetti from "canvas-confetti";
import styles from "../../styles/Game.module.css";
import { createClient } from "@supabase/supabase-js";
import { getAddress, AddressPurpose, BitcoinNetworkType } from "sats-connect";
import Image from "next/image"; // Next.js Image component
import Link from "next/link";
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";

const supabase = createClient(
  "https://taiyharwcaiumvqqxpml.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhaXloYXJ3Y2FpdW12cXF4cG1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAyOTg3MDIsImV4cCI6MjA1NTg3NDcwMn0.pccfqBA7pjPBt3HBgcTV9YoLs48R2lbNk1tRvdd5WsQ"
);

interface Element {
  x: number;
  y: number;
  dx: number;
  dy: number;
  type: "frog" | "insect" | "snake";
}

interface WalletAddress {
  address: string;
  publicKey: string;
  purpose: AddressPurpose;
  addressType?: string;
}

export default function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const elementsRef = useRef<Element[]>([]);
  const isPlayingRef = useRef(false);
  const predictionRef = useRef<"frog" | "insect" | "snake" | null>(null);
  const [counts, setCounts] = useState({ frog: 33, insect: 33, snake: 33 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [winner, setWinner] = useState<"frog" | "insect" | "snake" | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const frogImgRef = useRef<HTMLImageElement | null>(null);
  const insectImgRef = useRef<HTMLImageElement | null>(null);
  const snakeImgRef = useRef<HTMLImageElement | null>(null);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [prediction, setPrediction] = useState<"frog" | "insect" | "snake" | null>(null);
  const [points, setPoints] = useState<number>(0);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const pathname = usePathname(); // Get current route

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "dark" | "light" | null;
    setTheme(savedTheme || "dark");

    if (typeof window !== "undefined") {
      let retries = 0;
      const maxRetries = 50;
      const setAppElement = () => {
        const appElement = document.querySelector("#__next");
        if (appElement) {
          Modal.setAppElement(appElement as HTMLElement);
        } else if (retries < maxRetries) {
          retries++;
          setTimeout(setAppElement, 100);
        }
      };
      setAppElement();

      // Use window.Image explicitly to avoid conflict with Next.js Image
      frogImgRef.current = new window.Image();
      frogImgRef.current.src = "/frog.png";
      insectImgRef.current = new window.Image();
      insectImgRef.current.src = "/insect.png";
      snakeImgRef.current = new window.Image();
      snakeImgRef.current.src = "/snake.png";
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const fetchLeaderboardAndRank = useCallback(async (address: string) => {
    try {
      const { data, error } = await supabase
        .from("game_users")
        .select("address, points")
        .order("points", { ascending: false });

      if (error) throw error;

      const rankedData = data.map((entry, index) => ({
        rank: index + 1,
        address: entry.address,
        points: entry.points,
      }));

      const userEntry = rankedData.find((entry) => entry.address === address);
      setUserRank(userEntry ? userEntry.rank : null);
    } catch (error) {
      console.error("Error fetching leaderboard for rank:", error);
      setUserRank(null);
    }
  }, []);

  const fetchPointsFromSupabase = useCallback(async (address: string) => {
    try {
      const { data, error } = await supabase
        .from("game_users")
        .select("points")
        .eq("address", address)
        .single();
      if (error && error.code !== "PGRST116") throw error;
      const fetchedPoints = data?.points || 0;
      setPoints(fetchedPoints);
      fetchLeaderboardAndRank(address);
    } catch (error) {
      console.error("Error fetching points from Supabase:", error);
      setPoints(0);
    }
  }, [fetchLeaderboardAndRank]);

  const saveWalletToSupabase = useCallback(async (address: string) => {
    try {
      const { data, error } = await supabase
        .from("game_users")
        .upsert({ address, points: 0 }, { onConflict: "address" })
        .select("points")
        .single();
      if (error) throw error;
      setPoints(data.points || 0);
      fetchLeaderboardAndRank(address);
    } catch (error) {
      console.error("Error saving wallet to Supabase:", error);
      setPoints(0);
    }
  }, [fetchLeaderboardAndRank]);

  const savePointsToSupabase = useCallback(async (address: string, newPoints: number) => {
    try {
      const { error } = await supabase
        .from("game_users")
        .update({ points: newPoints, updated_at: new Date().toISOString() })
        .eq("address", address);
      if (error) throw error;
      fetchLeaderboardAndRank(address);
    } catch (error) {
      console.error("Error saving points to Supabase:", error);
    }
  }, [fetchLeaderboardAndRank]);

  const getBtcProvider = async () => {
    if (window.magicEden?.bitcoin) {
      return window.magicEden.bitcoin;
    }
    throw new Error("Magic Eden wallet not detected");
  };

  const connectWallet = useCallback(async (provider: "magicEden" | "xverse" | "unisat") => {
    setIsWalletModalOpen(false);
    try {
      let address: string | null = null;

      if (provider === "magicEden") {
        if (window.magicEden?.bitcoin) {
          await getAddress({
            getProvider: getBtcProvider,
            payload: {
              purposes: [AddressPurpose.Ordinals, AddressPurpose.Payment],
              message: "Address for Froggy Folios game",
              network: { type: BitcoinNetworkType.Mainnet },
            },
            onFinish: (response) => {
              const taprootAddress = response.addresses.find(
                (addr: WalletAddress) => addr.purpose === AddressPurpose.Ordinals && addr.address.startsWith("bc1p")
              );
              address = taprootAddress?.address || null;
            },
            onCancel: () => {
              throw new Error("Request canceled by user");
            },
          });

          if (!address) throw new Error("No Taproot address (bc1p...) found");
        } else {
          alert("Magic Eden wallet not detected. Please install it.");
          window.open("https://wallet.magiceden.io/", "_blank");
          return;
        }
      } else if (provider === "xverse") {
        const xverse = (window as any).XverseProviders as {
          BitcoinProvider?: {
            request: (method: string, params: any) => Promise<{ result: any; error?: { message: string } }>;
          };
        } | undefined;

        if (xverse?.BitcoinProvider) {
          const connectResponse = await xverse.BitcoinProvider.request("wallet_connect", null);
          if (!connectResponse.result) throw new Error(connectResponse.error?.message || "Xverse connection failed");

          const params = {
            purposes: ["payment", "ordinals"],
            message: "Provide addresses for Froggy Folios game",
            network: { type: "Mainnet" },
          };
          const addressResponse = await xverse.BitcoinProvider.request("getAddresses", params);
          if (!addressResponse.result || !Array.isArray(addressResponse.result.addresses))
            throw new Error(addressResponse.error?.message || "Failed to fetch Xverse addresses");

          const taprootAddressItem = addressResponse.result.addresses.find(
            (addr: any) => addr.purpose === "ordinals" && addr.address.startsWith("bc1p")
          );
          address = taprootAddressItem?.address || null;

          if (!address) throw new Error("No Taproot address (bc1p...) found");
        } else {
          alert("Xverse wallet not detected. Please install it.");
          window.open("https://www.xverse.app/", "_blank");
          return;
        }
      } else if (provider === "unisat") {
        if (window.unisat) {
          try {
            const accounts = await window.unisat.requestAccounts();
            address = accounts.find((addr: string) => addr.startsWith("bc1p")) || null;
            if (!address) {
              const currentAccounts = await window.unisat.getAccounts();
              address = currentAccounts.find((addr: string) => addr.startsWith("bc1p")) || null;
            }
          } catch (e) {
            throw new Error("Failed to connect UniSat wallet");
          }
        } else {
          alert("UniSat wallet not detected. Please install it.");
          window.open("https://unisat.io/", "_blank");
          return;
        }
      }

      if (!address) {
        alert("No Taproot address (bc1p...) found. Please ensure your wallet is set to Taproot.");
        return;
      }

      setWalletAddress(address);
      setPoints(0);

      const { data: existingData } = await supabase
        .from("game_users")
        .select("points")
        .eq("address", address)
        .single();

      if (!existingData) {
        await saveWalletToSupabase(address);
      } else {
        await fetchPointsFromSupabase(address);
      }
    } catch (error) {
      console.error(`${provider} connection error:`, error);
      alert(`Failed to connect ${provider} wallet: ${error instanceof Error ? error.message : "Unknown error"}`);
      setWalletAddress(null);
      setPoints(0);
      setUserRank(null);
    }
  }, [fetchPointsFromSupabase, saveWalletToSupabase]);

  const disconnectWallet = useCallback(async () => {
    try {
      if (walletAddress) {
        const xverse = (window as any).XverseProviders as {
          BitcoinProvider?: {
            request: (method: string, params: any) => Promise<any>;
          };
        } | undefined;

        if (xverse?.BitcoinProvider) {
          await xverse.BitcoinProvider.request("wallet_disconnect", null);
        }
        setWalletAddress(null);
        setPoints(0);
        setUserRank(null);
      }
    } catch (error) {
      console.error("Error disconnecting wallet:", error);
      alert("Failed to disconnect wallet");
      setWalletAddress(null);
      setPoints(0);
      setUserRank(null);
    }
  }, [walletAddress]);

  const initializeElements = useCallback((width: number, height: number) => {
    const elements: Element[] = [];
    const size = Math.max(Math.min(width * 0.04, 20), 12);
    const speed = 1;
    const padding = size;

    for (let i = 0; i < 33; i++) {
      elements.push({
        x: padding + (i % 6) * size * 1.2,
        y: padding + Math.floor(i / 6) * size * 1.2,
        dx: (Math.random() - 0.5) * speed,
        dy: (Math.random() - 0.5) * speed,
        type: "frog",
      });
    }

    for (let i = 0; i < 33; i++) {
      elements.push({
        x: width - padding - size - (i % 6) * size * 1.2,
        y: padding + Math.floor(i / 6) * size * 1.2,
        dx: (Math.random() - 0.5) * speed,
        dy: (Math.random() - 0.5) * speed,
        type: "insect",
      });
    }

    for (let i = 0; i < 33; i++) {
      elements.push({
        x: padding + (i % 6) * size * 1.2,
        y: height - padding - size - Math.floor(i / 6) * size * 1.2,
        dx: (Math.random() - 0.5) * speed,
        dy: (Math.random() - 0.5) * speed,
        type: "snake",
      });
    }

    elementsRef.current = elements;
    updateCounts(elements);
  }, []);

  const updateCounts = (elements: Element[]) => {
    const frog = elements.filter((el) => el.type === "frog").length;
    const insect = elements.filter((el) => el.type === "insect").length;
    const snake = elements.filter((el) => el.type === "snake").length;
    setCounts({ frog, insect, snake });
  };

  const animate = useCallback(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    const width = canvasRef.current.width;
    const height = canvasRef.current.height;
    const elements = elementsRef.current;

    ctx.fillStyle = theme === "dark" ? "#2a3d2a" : "#e0e7ff";
    ctx.fillRect(0, 0, width, height);

    if (!isPlayingRef.current) {
      const size = Math.min(width * 0.15, 80);
      ctx.font = `${size * 0.5}px "Poppins", sans-serif`;
      ctx.fillStyle = theme === "dark" ? "#ffffff" : "#1f2937";
      ctx.textAlign = "center";
      if (frogImgRef.current) ctx.drawImage(frogImgRef.current, width * 0.25 - size / 2, height / 2 - size / 2, size, size);
      ctx.fillText("VS", width * 0.4, height / 2 + size * 0.15);
      if (insectImgRef.current) ctx.drawImage(insectImgRef.current, width * 0.55 - size / 2, height / 2 - size / 2, size, size);
      ctx.fillText("VS", width * 0.7, height / 2 + size * 0.15);
      if (snakeImgRef.current) ctx.drawImage(snakeImgRef.current, width * 0.85 - size / 2, height / 2 - size / 2, size, size);
    }

    if (isPlayingRef.current) {
      elements.forEach((el, i) => {
        el.x += el.dx;
        el.y += el.dy;

        const size = Math.max(Math.min(width * 0.04, 20), 12);
        if (el.x < 0 || el.x > width - size) el.dx *= -1;
        if (el.y < 0 || el.y > height - size) el.dy *= -1;

        for (let j = i + 1; j < elements.length; j++) {
          const other = elements[j];
          const dist = Math.sqrt((el.x - other.x) ** 2 + (el.y - other.y) ** 2);
          if (dist < size * 1.1) {
            if (el.type === "frog" && other.type === "insect") other.type = "frog";
            else if (el.type === "insect" && other.type === "frog") el.type = "frog";
            else if (el.type === "insect" && other.type === "snake") other.type = "insect";
            else if (el.type === "snake" && other.type === "insect") el.type = "insect";
            else if (el.type === "snake" && other.type === "frog") other.type = "snake";
            else if (el.type === "frog" && other.type === "snake") el.type = "snake";
          }
        }

        if (el.type === "frog" && frogImgRef.current) {
          ctx.drawImage(frogImgRef.current, el.x, el.y, size, size);
        } else if (el.type === "insect" && insectImgRef.current) {
          ctx.drawImage(insectImgRef.current, el.x, el.y, size, size);
        } else if (el.type === "snake" && snakeImgRef.current) {
          ctx.drawImage(snakeImgRef.current, el.x, el.y, size, size);
        }
      });

      updateCounts(elements);

      const allSame = elements.every((el) => el.type === elements[0].type);
      if (allSame) {
        isPlayingRef.current = false;
        const gameWinner = elements[0].type;
        setWinner(gameWinner);
        if (gameWinner === predictionRef.current && walletAddress) {
          const newPoints = points + 10;
          setPoints(newPoints);
          savePointsToSupabase(walletAddress, newPoints);
        }
        setIsModalOpen(true);
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.9 },
          colors: theme === "dark" ? ["#00ff00", "#4CAF50", "#8BC34A"] : ["#4CAF50", "#8BC34A", "#d4e157"],
          zIndex: 1002,
        });
        return;
      }
    }

    if (isPlayingRef.current) {
      requestAnimationFrame(animate);
    }
  }, [theme, points, walletAddress, savePointsToSupabase]);

  const startGame = useCallback((predictedType: "frog" | "insect" | "snake") => {
    if (!walletAddress) {
      alert("Please connect your wallet first!");
      return;
    }
    if (!isPlayingRef.current && canvasRef.current) {
      setPrediction(predictedType);
      predictionRef.current = predictedType;
      setCountdown(3);
      const width = canvasRef.current.width;
      const height = canvasRef.current.height;
      initializeElements(width, height);

      const countdownInterval = setInterval(() => {
        setCountdown((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(countdownInterval);
            isPlayingRef.current = true;
            animate();
            return null;
          }
          return prev - 1;
        });
      }, 1000);
    }
  }, [walletAddress, animate, initializeElements]);

  useEffect(() => {
    const resizeCanvas = () => {
      if (canvasRef.current && containerRef.current) {
        const container = containerRef.current;
        const maxWidth = Math.min(container.clientWidth * 0.95, 700);
        const maxHeight = Math.min(window.innerHeight * 0.5, 400);
        const aspectRatio = 3 / 2;
        let width = maxWidth;
        let height = width / aspectRatio;

        if (height > maxHeight) {
          height = maxHeight;
          width = height * aspectRatio;
        }

        canvasRef.current.width = width;
        canvasRef.current.height = height;

        if (!isPlayingRef.current) {
          animate();
        } else {
          initializeElements(width, height);
          animate();
        }
      }
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, [animate, initializeElements, theme]);

  const getLeadingElement = () => {
    const { frog, insect, snake } = counts;
    const max = Math.max(frog, insect, snake);
    if (frog === max) return "frog";
    if (insect === max) return "insect";
    return "snake";
  };

  const handleShareOnX = useCallback(() => {
    let tweetText = "";
    switch (winner) {
      case "frog":
        tweetText = "Frogs have dominated the ecosystem in the Froggy Folios game!";
        break;
      case "insect":
        tweetText = "Insects have overrun the habitat in the Froggy Folios game!";
        break;
      case "snake":
        tweetText = "Snakes have claimed supremacy in the Froggy Folios game!";
        break;
      default:
        tweetText = "A wild battle unfolded in the Froggy Folios game!";
    }

    tweetText += ` Final count: 🐸 ${counts.frog} | 🪲 ${counts.insect} | 🐍 ${counts.snake}. I predicted ${prediction} and have ${points} points! Play now at @FroggyFolios! https://froggyfolios.xyz/foodchain`;

    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
    window.open(tweetUrl, "_blank", "width=600,height=400");
  }, [winner, counts, prediction, points]);

  const resetGame = () => {
    setIsModalOpen(false);
    setWinner(null);
    setPrediction(null);
    predictionRef.current = null;
    setCounts({ frog: 33, insect: 33, snake: 33 });
  };

  const getRankDisplay = (rank: number | null) => {
    if (rank === null) return "N/A";
    let medal = "";
    if (rank === 1) medal = " 🥇";
    else if (rank === 2) medal = " 🥈";
    else if (rank === 3) medal = " 🥉";
    return `${rank}${medal}`;
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
      <div className="w-full max-w-5xl mx-auto flex-grow flex flex-col items-center justify-center py-12 px-4">
        <div
          className={`${styles.container} ${theme === "dark" ? styles.dark : styles.light}`}
          ref={containerRef}
          style={{ visibility: "visible" }}
        >
          <h1 className={styles.title}>Froggy Food Chain</h1>
          {walletAddress ? (
            <>
              <div className={`${styles.pointsDisplay} ${theme === "dark" ? styles.dark : styles.light}`}>
                <button
                  onClick={disconnectWallet}
                  className={`${styles.disconnectButton} ${
                    theme === "dark" ? styles.disconnectButtonDark : styles.disconnectButtonLight
                  }`}
                >
                  Disconnect
                </button>
                <div className={styles.points}>Total Shelf points: {points}</div>
                <div className={styles.userInfo}>
                  <span className={styles.userLabel}>user: </span>
                  <span className={styles.userAddress}>
                    {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                  </span>
                  <span className={styles.rankLabel}>Rank: </span>
                  <span className={`${styles.rankValue} ${styles.rankHighlight}`}>
                    {getRankDisplay(userRank)}
                  </span>
                </div>
              </div>
              {!prediction && !countdown && !isPlayingRef.current && (
                <div className={styles.predictionContainer}>
                  <p className={styles.predictionText}>Who will win?</p>
                  <div className={styles.predictionRow}>
                    <button
                      onClick={() => startGame("frog")}
                      className={`${styles.predictionButton} ${
                        theme === "dark" ? styles.predictionButtonDark : styles.predictionButtonLight
                      }`}
                    >
                      🐸 Frog
                    </button>
                    <button
                      onClick={() => startGame("insect")}
                      className={`${styles.predictionButton} ${
                        theme === "dark" ? styles.predictionButtonDark : styles.predictionButtonLight
                      }`}
                    >
                      🪲 Insect
                    </button>
                    <button
                      onClick={() => startGame("snake")}
                      className={`${styles.predictionButton} ${
                        theme === "dark" ? styles.predictionButtonDark : styles.predictionButtonLight
                      }`}
                    >
                      🐍 Snake
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className={styles.predictionContainer}>
              <button
                onClick={() => setIsWalletModalOpen(true)}
                className={`${styles.connectWalletButton} ${
                  theme === "dark" ? styles.connectWalletButtonDark : styles.connectWalletButtonLight
                }`}
              >
                Connect Wallet
              </button>
            </div>
          )}
          {countdown !== null && (
            <div className={styles.countdown} key={countdown}>
              Simulation begins in: {countdown}...
            </div>
          )}
          {prediction && (countdown !== null || isPlayingRef.current) && (
            <div className={styles.predictionChoice}>
              You chose: {prediction === "frog" ? "🐸 Frog" : prediction === "insect" ? "🪲 Insect" : "🐍 Snake"}
            </div>
          )}
          <div className={`${styles.scoreBoard} ${theme === "dark" ? styles.scoreBoardDark : styles.scoreBoardLight}`}>
            <span className={getLeadingElement() === "frog" ? styles.highlight : ""}>
              🐸 {counts.frog}
            </span>
            <span className={getLeadingElement() === "insect" ? styles.highlight : ""}>
              🪲 {counts.insect}
            </span>
            <span className={getLeadingElement() === "snake" ? styles.highlight : ""}>
              🐍 {counts.snake}
            </span>
          </div>
          <canvas ref={canvasRef} className={styles.gameCanvas} />
        </div>
      </div>

      {/* Modals */}
      <Modal
        isOpen={isModalOpen}
        onRequestClose={resetGame}
        className={`${styles.modal} ${theme === "dark" ? styles.modalDark : styles.modalLight}`}
        overlayClassName={styles.modalOverlay}
        style={{ overlay: { zIndex: 1000 } }}
      >
        <h2 className={styles.modalTitle}>
          {winner === "frog"
            ? "Frogs have dominated the ecosystem!"
            : winner === "insect"
            ? "Insects have overrun the habitat!"
            : "Snakes have claimed supremacy!"}
        </h2>
        <p
          className={`${styles.modalText} ${winner === prediction ? styles.congratsText : styles.badLuckText}`}
        >
          {winner === prediction
            ? "Congratulations! You predicted correctly! +10 points added!"
            : "Bad luck this time! Play again?"}
        </p>
        <p className={styles.modalText}>Final Count: 🐸 {counts.frog} | 🪲 {counts.insect} | 🐍 {counts.snake}</p>
        <p className={styles.modalText}>Total Points: {points}</p>
        <p className={styles.modalText}>
          Your Rank: <span className={styles.rankHighlight}>{getRankDisplay(userRank)}</span>
        </p>
        <p className={`${styles.credits} ${theme === "dark" ? styles.creditsDark : styles.creditsLight}`}>
          Developed by <span className={styles.highlightName}>Froggy Folios</span>
        </p>
        <div className={styles.buttonContainer}>
          <button
            onClick={handleShareOnX}
            className={`${styles.shareButton} ${theme === "dark" ? styles.shareButtonDark : styles.shareButtonLight}`}
          >
            Share on X
          </button>
          <button
            onClick={resetGame}
            className={`${styles.closeButton} ${theme === "dark" ? styles.closeButtonDark : styles.closeButtonLight}`}
          >
            Play Again
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={isWalletModalOpen}
        onRequestClose={() => setIsWalletModalOpen(false)}
        className={`${styles.walletModal} ${theme === "dark" ? styles.modalDark : styles.modalLight}`}
        overlayClassName={styles.modalOverlay}
        style={{ overlay: { zIndex: 1000 } }}
      >
        <h2 className={styles.modalTitle}>Choose Your Wallet</h2>
        <div className={styles.walletOptions}>
          <button
            onClick={() => connectWallet("magicEden")}
            className={`${styles.walletButton} ${theme === "dark" ? styles.walletButtonDark : styles.walletButtonLight}`}
          >
            Magic Eden
          </button>
          <button
            onClick={() => connectWallet("xverse")}
            className={`${styles.walletButton} ${theme === "dark" ? styles.walletButtonDark : styles.walletButtonLight}`}
          >
            Xverse
          </button>
          <button
            onClick={() => connectWallet("unisat")}
            className={`${styles.walletButton} ${theme === "dark" ? styles.walletButtonDark : styles.walletButtonLight}`}
          >
            UniSat
          </button>
        </div>
        <button
          onClick={() => setIsWalletModalOpen(false)}
          className={`${styles.closeButton} ${theme === "dark" ? styles.closeButtonDark : styles.closeButtonLight}`}
        >
          Cancel
        </button>
      </Modal>

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