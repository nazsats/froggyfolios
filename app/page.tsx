"use client";

import { useState } from "react";
import Image from "next/image";  // ✅ Use Next.js Image for optimization
import styles from "@/styles/home.module.css"; // ✅ Fix CSS import

export default function Home() {
  const [walletAddress, setWalletAddress] = useState("");
  const [result, setResult] = useState({ message: "", color: "#ffffff" });

  const checkWhitelist = async () => {
    if (!walletAddress.trim()) {
      setResult({ message: "Please enter a wallet address", color: "#ffff00" });
      return;
    }

    try {
      setResult({ message: "Checking...", color: "#ffffff" });

      // Call API
      const response = await fetch("/api/checkWhitelist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ address: walletAddress }),
      });

      const data = await response.json();

      if (data.success) {
        setResult({
          message: data.message,
          color: data.isWhitelisted ? "#00ff00" : "#ff0000",
        });
      } else {
        setResult({ message: data.message, color: "#ff0000" });
      }
    } catch (error) {
      setResult({ message: "Error checking whitelist status", color: "#ff0000" });
      console.error("Error:", error);
    }
  };

  return (
    <div className={styles.container}>
      <Image src="/hello.png" alt="Hello" width={300} height={300} className={styles.helloImage} />
      
      <div className={styles.backSection}>
        <a href="/">
          <Image src="/logo.png" alt="Logo" width={100} height={100} className={styles.smallLogo} />
        </a>
      </div>

      <div className={styles.content}>
        <h1 className={styles.title}>WHITELIST CHECKER</h1>
        <div className={styles.checkerForm}>
          <input
            type="text"
            placeholder="Enter wallet address"
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
            className={styles.input}
          />
          <button onClick={checkWhitelist} className={styles.button}>Check Status</button>
        </div>
        <div style={{ color: result.color }} className={styles.result}>
          {result.message}
        </div>
      </div>

      <p className={styles.copyright}>© 2025 Froggy Folios</p>
    </div>
  );
}
