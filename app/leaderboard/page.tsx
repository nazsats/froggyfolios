"use client";

import { useEffect, useState, useCallback } from "react";
import Modal from "react-modal";
import gameStyles from "../../styles/Game.module.css";
import styles from "../../styles/Leaderboard.module.css";
import { createClient } from "@supabase/supabase-js";
import { getAddress, AddressPurpose, BitcoinNetworkType } from "sats-connect";

const supabase = createClient(
  "https://taiyharwcaiumvqqxpml.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhaXloYXJ3Y2FpdW12cXF4cG1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAyOTg3MDIsImV4cCI6MjA1NTg3NDcwMn0.pccfqBA7pjPBt3HBgcTV9YoLs48R2lbNk1tRvdd5WsQ"
);

interface LeaderboardEntry {
  rank: number;
  address: string;
  points: number;
}

interface WalletAddress {
  address: string;
  publicKey: string;
  purpose: AddressPurpose;
  addressType?: string;
}

interface XverseAddress {
  address: string;
  purpose: "payment" | "ordinals";
  [key: string]: any;
}

declare global {
  interface Window {
    magicEden?: { bitcoin: any };
    unisat?: {
      requestAccounts: () => Promise<string[]>;
      getAccounts: () => Promise<string[]>;
      [key: string]: any;
    };
    XverseProviders?: {
      BitcoinProvider?: {
        request: (method: string, params: any) => Promise<any>;
      };
    };
  }
}

export default function Leaderboard() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [userPoints, setUserPoints] = useState<number>(0);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const entriesPerPage = 20;

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "dark" | "light" | null;
    setTheme(savedTheme || "dark");
    if (typeof window !== "undefined") {
      const appElement = document.querySelector("#__next");
      if (appElement) {
        Modal.setAppElement(appElement as HTMLElement);
      } else {
        console.warn("App element '#__next' not found yet; modal may not work until DOM is fully loaded.");
      }
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
  };

  const fetchLeaderboard = useCallback(async () => {
    try {
      // Fetch Game 1 scores from game_users
      const { data: game1Data, error: game1Error } = await supabase
        .from("game_users")
        .select("address, points");

      if (game1Error) throw game1Error;
      console.log("Game 1 Data (game_users):", game1Data);

      // Fetch Game 2 scores from player_scores
      const { data: game2Data, error: game2Error } = await supabase
        .from("player_scores")
        .select("wallet_address, total_score");

      if (game2Error) throw game2Error;
      console.log("Game 2 Data (player_scores):", game2Data);

      // Combine scores
      const combinedScores: { [address: string]: number } = {};

      // Process Game 1 scores
      game1Data.forEach((entry) => {
        combinedScores[entry.address] = (combinedScores[entry.address] || 0) + entry.points;
      });

      // Process Game 2 scores (mapping wallet_address to address)
      game2Data.forEach((entry) => {
        const address = entry.wallet_address; // Use wallet_address as the key
        combinedScores[address] = (combinedScores[address] || 0) + entry.total_score;
      });

      // Convert to leaderboard format and sort
      const rankedData = Object.entries(combinedScores)
        .map(([address, points], index) => ({
          rank: index + 1,
          address,
          points,
        }))
        .sort((a, b) => b.points - a.points)
        .map((entry, index) => ({ ...entry, rank: index + 1 }));

      console.log("Combined Leaderboard Data:", rankedData);
      setLeaderboard(rankedData);

      if (walletAddress) {
        const userEntry = rankedData.find((entry) => entry.address === walletAddress);
        setUserRank(userEntry ? userEntry.rank : null);
        setUserPoints(userEntry ? userEntry.points : 0);
      }
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      setLeaderboard([]);
    }
  }, [walletAddress]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

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

  const disconnectWallet = () => {
    setWalletAddress(null);
    setUserPoints(0);
    setUserRank(null);
  };

  const getRankDisplay = (rank: number) => {
    let medal = "";
    if (rank === 1) medal = " 🥇";
    else if (rank === 2) medal = " 🥈";
    else if (rank === 3) medal = " 🥉";
    return `${rank}${medal}`;
  };

  const indexOfLastEntry = currentPage * entriesPerPage;
  const indexOfFirstEntry = indexOfLastEntry - entriesPerPage;
  const currentEntries = leaderboard.slice(indexOfFirstEntry, indexOfLastEntry);
  const totalPages = Math.ceil(leaderboard.length / entriesPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  return (
    <div className={`${gameStyles.container} ${theme === "dark" ? gameStyles.dark : gameStyles.light}`}>
      <div className={gameStyles.themeToggle}>
        <button 
          onClick={toggleTheme} 
          className={`${gameStyles.themeButton} ${theme === "dark" ? gameStyles.themeButtonDark : gameStyles.themeButtonLight}`}
        >
          {theme === "dark" ? "☀️ Light" : "🌙 Dark"}
        </button>
      </div>
      <h1 className={gameStyles.title}>Leaderboard</h1>
      {walletAddress ? (
        <div className={styles.userInfoContainer}>
          <div className={styles.userInfoHeader}>
            <span className={styles.userAddress}>
              {`${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`}
            </span>
            <button 
              onClick={disconnectWallet} 
              className={`${gameStyles.disconnectButton} ${theme === "dark" ? gameStyles.disconnectButtonDark : gameStyles.disconnectButtonLight}`}
            >
              Disconnect
            </button>
          </div>
          <div className={styles.userStats}>
            <span className={gameStyles.rankLabel}>Rank:</span>
            <span className={gameStyles.rankHighlight}>{getRankDisplay(userRank || 0)}</span>
            <span className={gameStyles.pointsLabel}>Points:</span>
            <span className={gameStyles.pointsHighlight}>{userPoints}</span>
          </div>
        </div>
      ) : (
        <div className={styles.connectContainer}>
          <button 
            onClick={() => setIsWalletModalOpen(true)} 
            className={`${gameStyles.connectWalletButton} ${theme === "dark" ? gameStyles.connectWalletButtonDark : gameStyles.connectWalletButtonLight}`}
          >
            Connect Wallet
          </button>
        </div>
      )}
      <div className={styles.leaderboardContainer}>
        <div className={styles.tableContainer}>
          <div className={styles.tableHeader}>
            <span>Rank</span>
            <span>User</span>
            <span>Points</span>
          </div>
          <div className={styles.tableBody}>
            {currentEntries.length > 0 ? (
              currentEntries.map((entry) => (
                <div
                  key={entry.address}
                  className={`${styles.tableRow} ${entry.address === walletAddress ? gameStyles.userRow : ""}`}
                >
                  <span className={entry.rank <= 3 ? gameStyles.topRank : ""}>
                    {getRankDisplay(entry.rank)}
                  </span>
                  <span>{`${entry.address.slice(0, 6)}...${entry.address.slice(-4)}`}</span>
                  <span>{entry.points}</span>
                </div>
              ))
            ) : (
              <div className={styles.noData}>No data available</div>
            )}
          </div>
        </div>
        {totalPages > 1 && (
          <div className={styles.pagination}>
            <button
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
              className={`${styles.paginationButton} ${theme === "dark" ? gameStyles.paginationButtonDark : gameStyles.paginationButtonLight}`}
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => paginate(page)}
                className={`${styles.paginationButton} ${currentPage === page ? gameStyles.activePage : ""} ${
                  theme === "dark" ? gameStyles.paginationButtonDark : gameStyles.paginationButtonLight
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`${styles.paginationButton} ${theme === "dark" ? gameStyles.paginationButtonDark : gameStyles.paginationButtonLight}`}
            >
              Next
            </button>
          </div>
        )}
      </div>

      <Modal
        isOpen={isWalletModalOpen}
        onRequestClose={() => setIsWalletModalOpen(false)}
        className={`${gameStyles.walletModal} ${theme === "dark" ? gameStyles.modalDark : gameStyles.modalLight}`}
        overlayClassName={gameStyles.modalOverlay}
        style={{ overlay: { zIndex: 1000 } }}
      >
        <h2 className={gameStyles.modalTitle}>Choose Your Wallet</h2>
        <div className={gameStyles.walletOptions}>
          <button 
            onClick={() => connectWallet("magicEden")} 
            className={`${gameStyles.walletButton} ${theme === "dark" ? gameStyles.walletButtonDark : gameStyles.walletButtonLight}`}
          >
            Magic Eden
          </button>
          <button 
            onClick={() => connectWallet("xverse")} 
            className={`${gameStyles.walletButton} ${theme === "dark" ? gameStyles.walletButtonDark : gameStyles.walletButtonLight}`}
          >
            Xverse
          </button>
          <button 
            onClick={() => connectWallet("unisat")} 
            className={`${gameStyles.walletButton} ${theme === "dark" ? gameStyles.walletButtonDark : gameStyles.walletButtonLight}`}
          >
            UniSat
          </button>
        </div>
        <button 
          onClick={() => setIsWalletModalOpen(false)} 
          className={`${gameStyles.closeButton} ${theme === "dark" ? gameStyles.closeButtonDark : gameStyles.closeButtonLight}`}
        >
          Cancel
        </button>
      </Modal>
    </div>
  );
}