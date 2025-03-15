"use client";

import { useEffect, useState } from "react";
import Modal from "react-modal";
import gameStyles from "../../styles/Game.module.css"; // Reuse game styles for theme
import styles from "../../styles/Leaderboard.module.css"; // New stylesheet for structure and table colors
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
  purpose: "payment" | "ordinals";
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
      if (appElement) Modal.setAppElement(appElement as HTMLElement);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
  };

  const fetchLeaderboard = async () => {
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
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [walletAddress]);

  const getBtcProvider = async () => {
    if (window.magicEden?.bitcoin) return window.magicEden.bitcoin;
    throw new Error("Magic Eden wallet not detected");
  };

  const connectWallet = async (provider: "magicEden" | "xverse" | "unisat") => {
    setIsWalletModalOpen(false);
    try {
      let address: string | null = null;

      if (provider === "magicEden") {
        if (window.magicEden?.bitcoin) {
          await getAddress({
            getProvider: getBtcProvider,
            payload: {
              purposes: [AddressPurpose.Ordinals, AddressPurpose.Payment],
              message: "Address for Froggy Folios leaderboard",
              network: { type: BitcoinNetworkType.Mainnet },
            },
            onFinish: (response) => {
              const taprootAddress = response.addresses.find(
                (addr: WalletAddress) => addr.purpose === "ordinals" && addr.address.startsWith("bc1p")
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
        if (window.XverseProviders?.BitcoinProvider) {
          const connectResponse = await window.XverseProviders.BitcoinProvider.request("wallet_connect", null);
          if (!connectResponse.result) throw new Error(connectResponse.error?.message || "Xverse connection failed");

          const params = {
            purposes: ["payment", "ordinals"],
            message: "Provide addresses for Froggy Folios leaderboard",
            network: { type: "Mainnet" },
          };
          const addressResponse = await window.XverseProviders.BitcoinProvider.request("getAddresses", params);
          if (!addressResponse.result || !Array.isArray(addressResponse.result.addresses)) {
            throw new Error(addressResponse.error?.message || "Failed to fetch Xverse addresses");
          }

          const taprootAddressItem = addressResponse.result.addresses.find(
            (addr) => addr.purpose === "ordinals" && addr.address.startsWith("bc1p")
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
            console.error("UniSat connect failed:", e);
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
      console.log(`Wallet connected with address: ${address}`);
    } catch (error) {
      console.error(`${provider} connection error:`, error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      alert(`Failed to connect ${provider} wallet: ${errorMessage}`);
      setWalletAddress(null);
    }
  };

  const disconnectWallet = () => {
    setWalletAddress(null);
    setUserPoints(0);
    setUserRank(null);
    console.log("Wallet disconnected");
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
        <button onClick={toggleTheme} className={`${gameStyles.themeButton} ${theme === "dark" ? gameStyles.themeButtonDark : gameStyles.themeButtonLight}`}>
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
            <button onClick={disconnectWallet} className={`${gameStyles.disconnectButton} ${theme === "dark" ? gameStyles.disconnectButtonDark : gameStyles.disconnectButtonLight}`}>
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
          <button onClick={() => setIsWalletModalOpen(true)} className={`${gameStyles.connectWalletButton} ${theme === "dark" ? gameStyles.connectWalletButtonDark : gameStyles.connectWalletButtonLight}`}>
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
          <button onClick={() => connectWallet("magicEden")} className={`${gameStyles.walletButton} ${theme === "dark" ? gameStyles.walletButtonDark : gameStyles.walletButtonLight}`}>
            Magic Eden
          </button>
          <button onClick={() => connectWallet("xverse")} className={`${gameStyles.walletButton} ${theme === "dark" ? gameStyles.walletButtonDark : gameStyles.walletButtonLight}`}>
            Xverse
          </button>
          <button onClick={() => connectWallet("unisat")} className={`${gameStyles.walletButton} ${theme === "dark" ? gameStyles.walletButtonDark : gameStyles.walletButtonLight}`}>
            UniSat
          </button>
        </div>
        <button onClick={() => setIsWalletModalOpen(false)} className={`${gameStyles.closeButton} ${theme === "dark" ? gameStyles.closeButtonDark : gameStyles.closeButtonLight}`}>
          Cancel
        </button>
      </Modal>
    </div>
  );
}