"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import styles from "../../styles/Game.module.css";
import Image from "next/image";
import Modal from "react-modal";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@supabase/supabase-js";
import { getAddress, AddressPurpose, BitcoinNetworkType } from "sats-connect";

const supabase = createClient(
  "https://taiyharwcaiumvqqxpml.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhaXloYXJ3Y2FpdW12cXF4cG1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAyOTg3MDIsImV4cCI6MjA1NTg3NDcwMn0.pccfqBA7pjPBt3HBgcTV9YoLs48R2lbNk1tRvdd5WsQ"
);

type GameObject = {
  id: number;
  type: "egg" | "frog" | "goldenfrog" | "insect" | "leaf" | "snake";
  x: number;
  y: number;
  spawnTime: number;
};

export default function Game2() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [isTweetModalOpen, setIsTweetModalOpen] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [score, setScore] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [lastGameScore, setLastGameScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isGameOver, setIsGameOver] = useState(false);
  const [gameObjects, setGameObjects] = useState<GameObject[]>([]);
  const [scorePopup, setScorePopup] = useState<{ x: number; y: number; points: number } | null>(null);
  const gameRef = useRef<HTMLDivElement>(null);
  const [playCount, setPlayCount] = useState<number>(0);
  const [lastPlayedAt, setLastPlayedAt] = useState<Date | null>(null);
  const [cooldownEnd, setCooldownEnd] = useState<Date | null>(null);
  const [tweetCooldown, setTweetCooldown] = useState<number | null>(null);
  const [tweetWindowEnd, setTweetWindowEnd] = useState<Date | null>(null);
  const [cooldownSecondsLeft, setCooldownSecondsLeft] = useState<number>(0);
  const [hasTweeted, setHasTweeted] = useState<boolean>(false); // Track if tweet was used
  const [hasEnded, setHasEnded] = useState<boolean>(false); // Track if game has ended to prevent re-trigger

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "dark" | "light" | null;
    setTheme(savedTheme || "dark");
    if (typeof window !== "undefined") {
      const appElement = document.querySelector("#__next");
      if (appElement) Modal.setAppElement(appElement as HTMLElement);
    }
    if (walletAddress) loadPlayerData();
  }, [walletAddress]);

  useEffect(() => {
    if (!cooldownEnd) return;
    const updateCooldown = () => {
      const now = new Date();
      const diff = cooldownEnd.getTime() - now.getTime();
      const secondsLeft = Math.max(0, Math.floor(diff / 1000));
      setCooldownSecondsLeft(secondsLeft);
      if (secondsLeft === 0) {
        setPlayCount(0);
        setCooldownEnd(null);
        setHasTweeted(false); // Reset tweet status after cooldown
        savePlayerData(0, null, true); // Reset after cooldown
      }
    };
    updateCooldown();
    const interval = setInterval(updateCooldown, 1000);
    return () => clearInterval(interval);
  }, [cooldownEnd]);

  const loadPlayerData = async () => {
    if (!walletAddress) return;

    const { data, error } = await supabase
      .from("player_scores")
      .select("*")
      .eq("wallet_address", walletAddress)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Error loading player data:", error);
      return;
    }

    if (data) {
      setPlayCount(data.play_count || 0);
      setLastPlayedAt(data.last_played_at ? new Date(data.last_played_at) : null);
      setTotalScore(data.total_score || 0);
      setLastGameScore(data.last_game_score || 0);
      setCooldownEnd(data.cooldown_end ? new Date(data.cooldown_end) : null);
      setTweetWindowEnd(data.tweet_window_end ? new Date(data.tweet_window_end) : null);
    } else {
      setPlayCount(0);
      setTotalScore(0);
      setLastGameScore(0);
      setCooldownEnd(null);
      setTweetWindowEnd(null);
      setHasTweeted(false);
      await savePlayerData(0);
    }
  };

  const savePlayerData = useCallback(
    async (newScore: number, newCooldownEnd?: Date | null, resetPlayCount: boolean = false) => {
      if (!walletAddress) return 0;

      const now = new Date();
      const newPlayCount = resetPlayCount ? 0 : playCount + 1;
      const updatedData = {
        wallet_address: walletAddress,
        play_count: newPlayCount,
        last_played_at: now.toISOString(),
        total_score: totalScore + newScore,
        last_game_score: newScore,
        updated_at: now.toISOString(),
        cooldown_end: newCooldownEnd ? newCooldownEnd.toISOString() : cooldownEnd ? cooldownEnd.toISOString() : null,
        tweet_window_end: tweetWindowEnd ? tweetWindowEnd.toISOString() : null,
      };

      const { error } = await supabase
        .from("player_scores")
        .upsert(updatedData, { onConflict: "wallet_address" });

      if (error) {
        console.error("Error saving player data:", error);
      } else {
        setPlayCount(newPlayCount);
        setLastPlayedAt(now);
        setTotalScore(prev => prev + newScore);
        setLastGameScore(newScore);
        if (newCooldownEnd !== undefined) setCooldownEnd(newCooldownEnd);
      }
      return newPlayCount; // Return the new playCount for synchronization
    },
    [walletAddress, playCount, totalScore, cooldownEnd, tweetWindowEnd]
  );

  const getAllowedTime = (): number => {
    if (playCount === 5 && tweetCooldown === 0 && hasTweeted) return 30; // Bonus life after tweet
    if (playCount >= 5) return 0; // No time until cooldown expires
    switch (playCount) {
      case 0: return 60;
      case 1: return 40;
      case 2: return 30;
      case 3: return 20;
      case 4: return 10;
      default: return 0;
    }
  };

  const canPlay = () => {
    if (!cooldownEnd) return true;
    const now = new Date();
    return now >= cooldownEnd;
  };

  const canTweet = () => {
    if (!tweetWindowEnd || hasTweeted) return false;
    const now = new Date();
    return now < tweetWindowEnd;
  };

  const getTweetTimeLeft = () => {
    if (!tweetWindowEnd) return 0;
    const now = new Date();
    const diff = tweetWindowEnd.getTime() - now.getTime();
    return Math.max(0, Math.floor(diff / 1000));
  };

  const handleTweetForLife = () => {
    if (playCount !== 5 || tweetCooldown !== null || !canTweet()) return;

    const tweetText = "🐸 Just ran out of energy in @froggyfolios!\n🔥 The battle against the snakes is intense! Claiming my free energy to keep playing!\n\nPlay now: https://www.froggyfolios.xyz/game2";
    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
    window.open(tweetUrl, "_blank", "width=600,height=400");

    setTweetCooldown(10);
    setHasTweeted(true); // Mark that the tweet has been used
    const countdown = setInterval(() => {
      setTweetCooldown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(countdown);
          setTweetCooldown(0); // Bonus life ready
          setTimeLeft(30);
          setIsTweetModalOpen(false);
          setGameStarted(false); // Reset state, but don’t start yet
          setIsGameOver(false);
          setGameObjects([]);
          setHasEnded(false); // Reset for bonus life
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
  };

  const connectWallet = useCallback(async (provider: "magicEden" | "xverse" | "unisat") => {
    setIsWalletModalOpen(false);
    try {
      let address: string | null = null;
      if (provider === "magicEden") {
        if (window.magicEden?.bitcoin) {
          await getAddress({
            getProvider: async () => window.magicEden!.bitcoin,
            payload: {
              purposes: [AddressPurpose.Ordinals],
              message: "Login to Froggy Folios",
              network: { type: BitcoinNetworkType.Mainnet },
            },
            onFinish: (response) => {
              const found = response.addresses.find(a => a.purpose === AddressPurpose.Ordinals && a.address.startsWith("bc1p"));
              address = found?.address || null;
            },
            onCancel: () => { throw new Error("Request canceled"); },
          });
        } else {
          alert("Magic Eden wallet not detected");
          window.open("https://wallet.magiceden.io", "_blank");
          return;
        }
      } else if (provider === "xverse") {
        const xverse = window.XverseProviders;
        if (xverse?.BitcoinProvider) {
          await xverse.BitcoinProvider.request("wallet_connect", null);
          const res = await xverse.BitcoinProvider.request("getAddresses", {
            purposes: ["ordinals"],
            message: "Login to Froggy Folios",
            network: { type: "Mainnet" },
          });
          const found = res.result.addresses.find((a: any) => a.purpose === "ordinals" && a.address.startsWith("bc1p"));
          address = found?.address || null;
        } else {
          alert("Xverse wallet not detected");
          window.open("https://www.xverse.app", "_blank");
          return;
        }
      } else if (provider === "unisat") {
        if (window.unisat) {
          const accounts = await window.unisat.requestAccounts();
          address = accounts.find(a => a.startsWith("bc1p")) || null;
        } else {
          alert("UniSat wallet not detected");
          window.open("https://unisat.io", "_blank");
          return;
        }
      }
      if (!address) {
        alert("No Taproot address found");
        return;
      }
      setWalletAddress(address);
    } catch (err) {
      console.error("Wallet connect error:", err);
      alert("Failed to connect wallet");
    }
  }, []);

  useEffect(() => {
    if (!gameStarted || isGameOver || hasEnded) return;
    if (timeLeft <= 0) {
      setIsGameOver(true);
      setHasEnded(true); // Mark game as ended to prevent re-trigger
      const oneHourLater = playCount >= 5 ? new Date(Date.now() + 60 * 60 * 1000) : undefined;
      savePlayerData(score, oneHourLater, playCount > 5).then((newPlayCount) => {
        console.log("Updated playCount after save:", newPlayCount); // Debug log
        if (playCount === 4) {
          const fiveMinutesLater = new Date(Date.now() + 5 * 60 * 1000);
          setTweetWindowEnd(fiveMinutesLater);
          setIsTweetModalOpen(true);
        } else if (playCount === 5 && hasTweeted) {
          setCooldownEnd(new Date(Date.now() + 60 * 60 * 1000));
          savePlayerData(0, new Date(Date.now() + 60 * 60 * 1000));
        } else if (playCount === 5 && !hasTweeted) {
          setCooldownEnd(new Date(Date.now() + 60 * 60 * 1000));
          savePlayerData(0, new Date(Date.now() + 60 * 60 * 1000));
        }
      });
      return;
    }
    const interval = setInterval(() => {
      setTimeLeft((t) => t - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [gameStarted, isGameOver, timeLeft, score, playCount, savePlayerData, hasTweeted, hasEnded]);

  useEffect(() => {
    if (gameStarted && !isGameOver && gameRef.current) {
      const spawnInterval = setInterval(() => {
        const rect = gameRef.current!.getBoundingClientRect();
        const types: ("egg" | "frog" | "goldenfrog" | "insect" | "leaf" | "snake")[] = 
          ["egg", "frog", "goldenfrog", "insect", "leaf", "snake"];
        const type = types[Math.floor(Math.random() * types.length)];
        const x = Math.random() * (rect.width - 60);
        const y = Math.random() * (rect.height - 60);
        const newObject: GameObject = { id: Date.now(), type, x, y, spawnTime: Date.now() };

        setGameObjects((prev) => [...prev, newObject]);

        setTimeout(() => {
          setGameObjects((prev) => {
            const now = Date.now();
            return prev.filter(obj => 
              obj.id !== newObject.id && 
              (now - obj.spawnTime < 3000)
            );
          });
        }, 3000);
      }, 1000);

      return () => clearInterval(spawnInterval);
    }
  }, [gameStarted, isGameOver]);

  const handleObjectClick = (obj: GameObject) => {
    let points = 0;
    switch (obj.type) {
      case "egg": points = 7; break;
      case "frog": points = 5; break;
      case "goldenfrog": points = 10; break;
      case "insect": points = 2; break;
      case "leaf": points = 1; break;
      case "snake":
        setScore(0);
        setScorePopup({ x: obj.x, y: obj.y, points: 0 });
        setTimeout(() => setScorePopup(null), 700);
        setGameObjects((prev) => prev.filter(o => o.id !== obj.id));
        return;
    }
    setScore((prev) => prev + points);
    setScorePopup({ x: obj.x, y: obj.y, points });
    setTimeout(() => setScorePopup(null), 700);
    setGameObjects((prev) => prev.filter(o => o.id !== obj.id));
  };

  const resetGame = () => {
    console.log("playCount before reset:", playCount); // Debug log
    setGameStarted(false);
    setTimeLeft(getAllowedTime());
    setScore(0);
    setIsGameOver(false);
    setGameObjects([]);
    setHasEnded(false); // Reset for next game
    if (playCount > 5) {
      setPlayCount(0);
      setTweetCooldown(null);
      setTweetWindowEnd(null);
      setHasTweeted(false);
    }
  };

  const startGame = () => {
    if (!canPlay() && playCount >= 5 && tweetCooldown !== 0) return;
    const allowedTime = getAllowedTime();
    if (allowedTime === 0) return;
    setScore(0);
    setTimeLeft(allowedTime);
    setIsGameOver(false);
    setGameObjects([]);
    setGameStarted(true);
    setHasEnded(false); // Reset for new game start
  };

  const handleSortAgain = () => {
    resetGame();
    startGame();
  };

  return (
    <div className={`${styles.container} ${theme === "dark" ? styles.dark : styles.light}`}>
      <div className={styles.themeToggle}>
        <button 
          onClick={toggleTheme} 
          className={`${styles.themeButton} ${theme === "dark" ? styles.themeButtonDark : styles.themeButtonLight}`}
        >
          {theme === "dark" ? "☀️ Light" : "🌙 Dark"}
        </button>
      </div>

      <h1 className={styles.title}>Froggy Folios!</h1>

      {!walletAddress && (
        <motion.button
          onClick={() => setIsWalletModalOpen(true)}
          className={`${styles.connectWalletButton} ${theme === "dark" ? styles.connectWalletButtonDark : styles.connectWalletButtonLight}`}
          whileHover={{ scale: 1.05 }}
        >
          Connect Wallet
        </motion.button>
      )}

      {walletAddress && (
        <div className={styles.pointsDisplay}>
          <div className={styles.userInfo}>
            <span className={styles.userLabel}>Frog Scholar:</span>
            <span className={styles.userAddress}>{walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</span>
          </div>

          <p className={styles.points} style={{ fontSize: "1.5rem", fontWeight: 600 }}>
            Total Folio Points: {totalScore}
          </p>

          <p className={styles.predictionText} style={{ fontSize: "1rem" }}>
            Last Shelf: {lastGameScore}
          </p>

          <div style={{ width: "100%", maxWidth: "300px", margin: "10px auto" }}>
            <p style={{ textAlign: "center", marginBottom: "5px" }}>
              Shelves Organized: {Math.min(playCount, 5)}/{playCount === 5 && tweetCooldown === 0 && hasTweeted ? 6 : 5}
            </p>
            <div style={{
              width: "100%",
              height: "20px",
              background: theme === "dark" ? "#333" : "#ddd",
              borderRadius: "10px",
              overflow: "hidden"
            }}>
              <div style={{
                width: `${(Math.min(playCount, 5) / (playCount === 5 && tweetCooldown === 0 && hasTweeted ? 6 : 5)) * 100}%`,
                height: "100%",
                background: "#00ff99",
                transition: "width 0.3s ease"
              }} />
            </div>
          </div>

          {!canPlay() && cooldownSecondsLeft > 0 && (
            <p style={{ textAlign: "center", color: "#ff4444" }}>
              Cooldown: {Math.floor(cooldownSecondsLeft / 60)}m {cooldownSecondsLeft % 60}s remaining
            </p>
          )}

          <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
            {!gameStarted && !isGameOver && (canPlay() || (playCount === 5 && tweetCooldown === 0 && hasTweeted)) && (
              <motion.button
                onClick={startGame}
                className={`${styles.connectWalletButton} ${theme === "dark" ? styles.connectWalletButtonDark : styles.connectWalletButtonLight}`}
                whileHover={{ scale: 1.1 }}
              >
                🐸 Start Sorting
              </motion.button>
            )}
            <motion.button
              onClick={() => setIsRulesModalOpen(true)}
              className={`${styles.connectWalletButton} ${theme === "dark" ? styles.connectWalletButtonDark : styles.connectWalletButtonLight}`}
              whileHover={{ scale: 1.1 }}
            >
              📚 Library Rules
            </motion.button>
            {!gameStarted && !isGameOver && playCount < 5 && (
              <motion.button
                onClick={handleSortAgain}
                className={`${styles.connectWalletButton} ${theme === "dark" ? styles.connectWalletButtonDark : styles.connectWalletButtonLight}`}
                whileHover={{ scale: 1.1 }}
              >
                🔄 Sort Again
              </motion.button>
            )}
          </div>
        </div>
      )}

      {(gameStarted || isGameOver) && (
        <div className={styles.pointsDisplay}>
          <p className={styles.points} style={{ fontSize: "2.2rem", fontWeight: 800 }}>
            Current Shelf Points: {score}
          </p>
          <p className={styles.predictionText}>
            ⏱ {`${Math.floor(timeLeft / 60)}:${timeLeft % 60 < 10 ? "0" : ""}${timeLeft % 60}`}
          </p>
        </div>
      )}

      <div
        className={styles.gameCanvas}
        ref={gameRef}
        style={{
          position: "relative",
          overflow: "hidden",
          width: "95%",
          maxWidth: "700px",
          height: "min(60vh, 500px)",
          border: "4px solid #00ff99",
          borderRadius: "15px",
          boxShadow: "0 0 20px rgba(0, 255, 153, 0.3)",
          margin: "20px auto",
          zIndex: 2,
          background: theme === "dark" ? "#0f172a" : "#f0fdfa"
        }}
      >
        <AnimatePresence>
          {gameObjects.map((obj) => (
            <motion.div
              key={obj.id}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ duration: 0.4 }}
              style={{ position: "absolute", top: obj.y, left: obj.x, width: 60, height: 60, zIndex: 10 }}
              onClick={() => handleObjectClick(obj)}
            >
              <Image 
                src={`/gameElements/${obj.type}.png`}
                alt={obj.type} 
                width={60} 
                height={60} 
                unoptimized 
              />
            </motion.div>
          ))}
        </AnimatePresence>

        {scorePopup && (
          <motion.div
            initial={{ opacity: 0, y: 0 }}
            animate={{ opacity: 1, y: -30 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.7 }}
            style={{ 
              position: "absolute", 
              top: scorePopup.y, 
              left: scorePopup.x, 
              fontSize: "1.5rem", 
              color: "#00ffcc", 
              fontWeight: "bold" 
            }}
          >
            {scorePopup.points === 0 ? "Eaten!" : `+${scorePopup.points}`}
          </motion.div>
        )}
      </div>

      <Modal
        isOpen={isWalletModalOpen}
        onRequestClose={() => setIsWalletModalOpen(false)}
        className={`${styles.walletModal} ${theme === "dark" ? styles.modalDark : styles.modalLight}`}
        overlayClassName={styles.modalOverlay}
      >
        <h2 className={styles.modalTitle}>Choose Your Frog Wallet</h2>
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
          Hop Away
        </button>
      </Modal>

      <Modal
        isOpen={isGameOver}
        onRequestClose={() => setIsGameOver(false)} // Only close modal, don’t reset
        className={`${styles.modal} ${theme === "dark" ? styles.modalDark : styles.modalLight}`}
        overlayClassName={styles.modalOverlay}
      >
        <h2 className={styles.modalTitle}>Shelf Closed!</h2>
        <p className={styles.modalText}>Your Shelf Points: {score}</p>
        <p className={styles.modalText}>Total Folio Points: {totalScore}</p>
        {playCount < 5 && (
          <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
            <button 
              onClick={handleSortAgain} 
              className={`${styles.closeButton} ${theme === "dark" ? styles.closeButtonDark : styles.closeButtonLight}`}
            >
              Sort Again
            </button>
            <button 
              onClick={() => setIsGameOver(false)} 
              className={`${styles.closeButton} ${theme === "dark" ? styles.closeButtonDark : styles.closeButtonLight}`}
            >
              Close
            </button>
          </div>
        )}
        {playCount === 5 && hasTweeted && (
          <p className={styles.modalText}>Bonus Life Complete! Cooldown starting...</p>
        )}
      </Modal>

      <Modal
        isOpen={isTweetModalOpen}
        onRequestClose={() => setIsTweetModalOpen(false)}
        className={`${styles.modal} ${theme === "dark" ? styles.modalDark : styles.modalLight}`}
        overlayClassName={styles.modalOverlay}
      >
        <h2 className={styles.modalTitle}>All Lives Used!</h2>
        <p className={styles.modalText}>You’ve played all your lives! Tweet for an extra life!</p>
        <p className={styles.modalText}>
          Time left to tweet: {Math.floor(getTweetTimeLeft() / 60)}m {getTweetTimeLeft() % 60}s
        </p>
        {canTweet() && tweetCooldown === null && (
          <motion.button
            onClick={handleTweetForLife}
            className={`${styles.connectWalletButton} ${theme === "dark" ? styles.connectWalletButtonDark : styles.connectWalletButtonLight}`}
            whileHover={{ scale: 1.1 }}
          >
            Tweet Now
          </motion.button>
        )}
        {tweetCooldown !== null && tweetCooldown > 0 && (
          <button
            className={`${styles.connectWalletButton} ${theme === "dark" ? styles.connectWalletButtonDark : styles.connectWalletButtonLight}`}
            disabled
          >
            Claiming in {tweetCooldown}s
          </button>
        )}
        <button 
          onClick={() => setIsTweetModalOpen(false)} 
          className={`${styles.closeButton} ${theme === "dark" ? styles.closeButtonDark : styles.closeButtonLight}`}
        >
          Close
        </button>
      </Modal>

      <Modal
        isOpen={isRulesModalOpen}
        onRequestClose={() => setIsRulesModalOpen(false)}
        className={`${styles.modal} ${theme === "dark" ? styles.modalDark : styles.modalLight}`}
        overlayClassName={styles.modalOverlay}
        style={{
          content: {
            maxWidth: "500px",
            margin: "auto",
            borderRadius: "15px",
            padding: "25px",
            background: theme === "dark" ? "#1a2b3c" : "#f9fafb",
            border: `2px solid ${theme === "dark" ? "#00ff99" : "#10b981"}`,
            boxShadow: "0 4px 15px rgba(0, 0, 0, 0.2)",
          },
          overlay: {
            backgroundColor: "rgba(0, 0, 0, 0.6)",
          },
        }}
      >
        <div style={{ textAlign: "center" }}>
          <h2 
            className={styles.modalTitle}
            style={{
              fontSize: "2rem",
              fontWeight: "700",
              color: theme === "dark" ? "#00ff99" : "#10b981",
              marginBottom: "20px",
              textShadow: theme === "dark" ? "0 0 5px rgba(0, 255, 153, 0.5)" : "none",
            }}
          >
            📚 Froggy Folios Library Rules
          </h2>
          <p 
            style={{
              fontSize: "1.1rem",
              color: theme === "dark" ? "#e5e7eb" : "#4b5563",
              marginBottom: "25px",
              lineHeight: "1.6",
            }}
          >
            Welcome to the Froggy Folios Library, where our amphibious librarian needs your help sorting the shelves!
          </p>
          <ul 
            style={{ 
              listStyleType: "none", 
              padding: "0", 
              textAlign: "left", 
              fontSize: "1rem", 
              color: theme === "dark" ? "#d1d5db" : "#6b7280",
            }}
          >
            <li style={{ marginBottom: "15px" }}>
              <strong style={{ color: theme === "dark" ? "#00ffcc" : "#059669" }}>Click to Collect:</strong>
              <ul style={{ listStyleType: "none", paddingLeft: "20px", marginTop: "5px" }}>
                <li style={{ marginBottom: "10px" }}>
                  🥚 <span style={{ color: "#10b981" }}>Egg</span>: +7 points - A promising start!
                </li>
                <li style={{ marginBottom: "10px" }}>
                  🐸 <span style={{ color: "#10b981" }}>Frog</span>: +5 points - A classic green read!
                </li>
                <li style={{ marginBottom: "10px" }}>
                  ✨ <span style={{ color: "#fbbf24" }}>Golden Frog</span>: +10 points - Rare and shiny!
                </li>
                <li style={{ marginBottom: "10px" }}>
                  🐞 <span style={{ color: "#60a5fa" }}>Insect</span>: +2 points - A tiny page snack!
                </li>
                <li style={{ marginBottom: "10px" }}>
                  🍃 <span style={{ color: "#10b981" }}>Leaf</span>: +1 point - A small but vital page!
                </li>
                <li style={{ marginBottom: "10px" }}>
                  🐍 <span style={{ color: "#ef4444" }}>Snake</span>: Munch! Resets your current shelf points to 0!
                </li>
              </ul>
            </li>
            <li style={{ marginBottom: "15px" }}>
              <strong style={{ color: theme === "dark" ? "#00ffcc" : "#059669" }}>Book Spawning:</strong> Items pop up every second—don’t let them pile up!
            </li>
            <li style={{ marginBottom: "15px" }}>
              <strong style={{ color: theme === "dark" ? "#00ffcc" : "#059669" }}>Shelf Life:</strong> Items stick around until you grab ‘em or they hop off after 3 seconds.
            </li>
            <li style={{ marginBottom: "15px" }}>
              <strong style={{ color: theme === "dark" ? "#00ffcc" : "#059669" }}>Time Crunch:</strong> Shelf time shrinks each round (60s, 40s, 30s, 20s, 10s), then resets after a 1-hour cooldown or tweet for a bonus 30s round!
            </li>
            <li style={{ marginBottom: "15px" }}>
              <strong style={{ color: theme === "dark" ? "#00ffcc" : "#059669" }}>Score Stacking:</strong> Your Total Folio Points grow with every shelf you sort!
            </li>
          </ul>
          <motion.button
            onClick={() => setIsRulesModalOpen(false)}
            className={`${styles.closeButton} ${theme === "dark" ? styles.closeButtonDark : styles.closeButtonLight}`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{
              marginTop: "20px",
              padding: "10px 25px",
              fontSize: "1rem",
              fontWeight: "600",
              borderRadius: "8px",
              background: theme === "dark" ? "#00ff99" : "#10b981",
              color: theme === "dark" ? "#1a2b3c" : "#ffffff",
              border: "none",
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
            }}
          >
            Ribbit Back
          </motion.button>
        </div>
      </Modal>

      <footer style={{ marginTop: "2rem", padding: "1rem", fontSize: "0.85rem", opacity: 0.6 }}>
        © 2025 Froggy Folios
      </footer>
    </div>
  );
}