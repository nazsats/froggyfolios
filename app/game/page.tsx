"use client";

import { useRef, useEffect, useState } from "react";
import Modal from "react-modal";
import confetti from "canvas-confetti";
import styles from "../../styles/Game.module.css";

interface Element {
  x: number;
  y: number;
  dx: number;
  dy: number;
  type: "frog" | "insect" | "snake";
}

export default function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const elementsRef = useRef<Element[]>([]);
  const isPlayingRef = useRef(false);
  const [counts, setCounts] = useState({ frog: 33, insect: 33, snake: 33 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [winner, setWinner] = useState<"frog" | "insect" | "snake" | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const frogImgRef = useRef<HTMLImageElement | null>(null);
  const insectImgRef = useRef<HTMLImageElement | null>(null);
  const snakeImgRef = useRef<HTMLImageElement | null>(null);
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "dark" | "light" | null;
    setTheme(savedTheme || "dark");

    if (typeof window !== "undefined") {
      const appElement = document.querySelector("#__next");
      if (appElement) {
        Modal.setAppElement(appElement as HTMLElement);
      }

      frogImgRef.current = new Image();
      frogImgRef.current.src = "/frog.png";
      insectImgRef.current = new Image();
      insectImgRef.current.src = "/insect.png";
      snakeImgRef.current = new Image();
      snakeImgRef.current.src = "/snake.png";
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
  };

  const initializeElements = (width: number, height: number) => {
    const elements: Element[] = [];
    const size = Math.max(Math.min(width * 0.04, 20), 12); // Scale size dynamically, min 12px, max 20px
    const speed = 0.7;
    const padding = size; // Padding from edges

    // Frogs (top-left)
    for (let i = 0; i < 33; i++) {
      elements.push({
        x: padding + (i % 6) * size * 1.2, // Reduced spacing factor for smaller screens
        y: padding + Math.floor(i / 6) * size * 1.2,
        dx: (Math.random() - 0.5) * speed,
        dy: (Math.random() - 0.5) * speed,
        type: "frog",
      });
    }

    // Insects (top-right)
    for (let i = 0; i < 33; i++) {
      elements.push({
        x: width - padding - size - (i % 6) * size * 1.2,
        y: padding + Math.floor(i / 6) * size * 1.2,
        dx: (Math.random() - 0.5) * speed,
        dy: (Math.random() - 0.5) * speed,
        type: "insect",
      });
    }

    // Snakes (bottom-left)
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
  };

  const updateCounts = (elements: Element[]) => {
    const frog = elements.filter((el) => el.type === "frog").length;
    const insect = elements.filter((el) => el.type === "insect").length;
    const snake = elements.filter((el) => el.type === "snake").length;
    setCounts({ frog, insect, snake });
  };

  const startCountdown = () => {
    if (!isPlayingRef.current && canvasRef.current) {
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
  };

  const animate = () => {
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
      ctx.font = `${size * 0.5}px Arial`;
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

        const size = Math.max(Math.min(width * 0.04, 20), 12); // Match size from initializeElements
        if (el.x < 0 || el.x > width - size) el.dx *= -1;
        if (el.y < 0 || el.y > height - size) el.dy *= -1;

        for (let j = i + 1; j < elements.length; j++) {
          const other = elements[j];
          const dist = Math.sqrt((el.x - other.x) ** 2 + (el.y - other.y) ** 2);
          if (dist < size * 1.1) { // Adjusted collision radius
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
        setWinner(elements[0].type);
        setIsModalOpen(true);
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: theme === "dark" ? ["#00ff00", "#4CAF50", "#8BC34A"] : ["#4CAF50", "#8BC34A", "#d4e157"],
        });
        return;
      }
    }

    if (isPlayingRef.current) {
      requestAnimationFrame(animate);
    }
  };

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
  }, [theme]);

  const getLeadingElement = () => {
    const { frog, insect, snake } = counts;
    const max = Math.max(frog, insect, snake);
    if (frog === max) return "frog";
    if (insect === max) return "insect";
    return "snake";
  };

  const handleShareOnX = () => {
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

    tweetText += ` Final count: 🐸 ${counts.frog} | 🪲 ${counts.insect} | 🐍 ${counts.snake}. Play now at @FroggyFolios! https://froggyfolios.com/game`;

    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
    window.open(tweetUrl, "_blank", "width=600,height=400");
  };

  return (
    <div className={`${styles.container} ${theme === "dark" ? styles.dark : styles.light}`} ref={containerRef}>
      <div className={styles.themeToggle}>
        <button onClick={toggleTheme} className={`${styles.themeButton} ${theme === "dark" ? styles.themeButtonDark : styles.themeButtonLight}`}>
          {theme === "dark" ? "☀️ Light" : "🌙 Dark"}
        </button>
      </div>
      <h1 className={styles.title}>Froggy Food Chain</h1>
      {countdown !== null && (
        <div className={styles.countdown} key={countdown}>
          Simulation begins in: {countdown}...
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
      <button
        onClick={startCountdown}
        className={`${styles.playButton} ${theme === "dark" ? styles.playButtonDark : styles.playButtonLight}`}
      >
        Start Simulation
      </button>

      <Modal
        isOpen={isModalOpen}
        onRequestClose={() => setIsModalOpen(false)}
        className={`${styles.modal} ${theme === "dark" ? styles.modalDark : styles.modalLight}`}
        overlayClassName={styles.modalOverlay}
      >
        <h2 className={styles.modalTitle}>
          {winner === "frog"
            ? "Frogs have dominated the ecosystem!"
            : winner === "insect"
            ? "Insects have overrun the habitat!"
            : "Snakes have claimed supremacy!"}
        </h2>
        <p className={styles.modalText}>Final Count: 🐸 {counts.frog} | 🪲 {counts.insect} | 🐍 {counts.snake}</p>
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
            onClick={() => setIsModalOpen(false)}
            className={`${styles.closeButton} ${theme === "dark" ? styles.closeButtonDark : styles.closeButtonLight}`}
          >
            Close
          </button>
        </div>
      </Modal>
    </div>
  );
}