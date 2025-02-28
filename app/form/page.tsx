"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { motion } from "framer-motion";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import formSideImage from "@/public/form-side.png";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Confetti from "react-confetti";

type FormStatus = "Pending" | "Under Review" | "Approved" | "Rejected" | null;

export default function TaskForm() {
  const [wallet, setWallet] = useState("");
  const [message, setMessage] = useState("");
  const [walletError, setWalletError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [showStatusPopup, setShowStatusPopup] = useState(false);
  const [formStatus, setFormStatus] = useState<FormStatus>(null);
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "dark" | "light" | null;
    setTheme(savedTheme || "dark");
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
  };

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      console.log("User not authenticated, redirecting to /login");
      router.replace("/login");
    }
  }, [status, router]);

  const checkExistingSubmission = useCallback(async () => {
    console.log("Checking submission for twitter_id:", session?.customUser?.id);
    const { data, error } = await supabase
      .from("tasks")
      .select("status")
      .eq("twitter_id", session?.customUser?.id)
      .limit(1);

    if (error) {
      console.error("Supabase error in checkExistingSubmission:", error.message || error);
    } else if (!data || data.length === 0) {
      console.log("No existing submission found for twitter_id:", session?.customUser?.id);
      setFormStatus(null);
    } else {
      console.log("Submission status found:", data[0].status);
      setFormStatus(data[0].status);
    }
  }, [session?.customUser?.id]);

  useEffect(() => {
    if (status === "authenticated" && session?.customUser?.id) {
      console.log("Session Data:", session);
      checkExistingSubmission();
    }
  }, [session, status, checkExistingSubmission]);

  const validateWallet = (value: string) => {
    if (value.trim() && !value.startsWith("bc1p")) {
      setWalletError("Please enter a valid Bitcoin Taproot address (must start with 'bc1p')");
    } else {
      setWalletError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("handleSubmit triggered");
    setLoading(true);

    if (formStatus) {
      console.log("Form already submitted, status:", formStatus);
      toast.error("You have already submitted the form!");
      setLoading(false);
      return;
    }

    if (!wallet.startsWith("bc1p")) {
      console.log("Invalid wallet address:", wallet);
      toast.error("Please enter a valid Bitcoin Taproot address (must start with 'bc1p')");
      setWalletError("Please enter a valid Bitcoin Taproot address (must start with 'bc1p')");
      setLoading(false);
      return;
    }

    console.log("Session Data in handleSubmit:", session);
    if (!session || !session.customUser) {
      console.error("Session or customUser missing");
      toast.error("Session not available. Please sign in again.");
      setLoading(false);
      return;
    }

    const twitterUsername = session.customUser.twitter_username || `user_${session.customUser.id}`;
    console.log("Inserting twitterUsername:", twitterUsername);

    try {
      console.log("Attempting Supabase insert with data:", {
        twitter_id: session.customUser.id,
        twitterusername: twitterUsername,
        wallet,
        message,
        status: "Pending",
      });
      const { data, error } = await supabase.from("tasks").insert([
        {
          twitter_id: session.customUser.id,
          twitterusername: twitterUsername,
          wallet,
          message,
          status: "Pending",
        },
      ]);

      if (error) {
        console.error("Supabase Insert Error:", error);
        toast.error(`Failed to submit: ${error.message}`);
        setLoading(false);
        return;
      }

      console.log("Submission successful, inserted data:", data);
      setShowPopup(true);
      toast.success("🎉 Form submitted successfully!", { position: "top-center" });
      await checkExistingSubmission();
    } catch (err) {
      console.error("Unexpected error in handleSubmit:", err);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckStatus = async () => {
    await checkExistingSubmission();
    setShowStatusPopup(true);
  };

  const handleSignOut = () => {
    console.log("handleSignOut triggered");
    signOut({ callbackUrl: "/login" });
  };

  const handleTwitterFollow = () => {
    window.open("https://twitter.com/intent/follow?screen_name=FroggyFolios", "_blank");
  };

  const getProgressValue = () => {
    switch (formStatus) {
      case "Approved":
      case "Rejected":
        return 100;
      default:
        return 69;
    }
  };

  const getDisplayStatus = () => {
    switch (formStatus) {
      case "Approved":
        return "Approved";
      case "Rejected":
        return "Rejected";
      default:
        return "Under Review";
    }
  };

  if (status === "loading") {
    return (
      <div
        className={`min-h-screen flex flex-col items-center justify-center ${
          theme === "dark"
            ? "bg-gradient-to-br from-green-800 via-blue-800 via-purple-800 via-pink-800 to-yellow-800 text-white"
            : "bg-gradient-to-br from-green-300 via-blue-300 via-purple-300 via-pink-300 to-yellow-300 text-gray-900"
        }`}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          className="relative w-24 h-24 mb-6"
        >
          <Image
            src="/logo.png"
            alt="Froggy Spinner"
            width={96}
            height={96}
            className="rounded-full border-4 border-green-500 shadow-lg"
          />
        </motion.div>
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-2xl font-bold"
        >
          Ribbit! Loading...
        </motion.p>
      </div>
    );
  }

  if (status !== "authenticated") {
    return null;
  }

  return (
    <div
      className={`min-h-screen flex flex-col items-center justify-center px-4 ${
        theme === "dark"
          ? "bg-gradient-to-br from-green-800 via-blue-800 via-purple-800 via-pink-800 to-yellow-800 text-white"
          : "bg-gradient-to-br from-green-300 via-blue-300 via-purple-300 via-pink-300 to-yellow-300 text-gray-900"
      }`}
    >
      <div className="absolute top-6 left-6 flex items-center text-2xl font-bold">
        <Image src="/logo.png" alt="Froggy Logo" width={30} height={30} className="ml-2" />
        <span>Froggy Whitelist</span>
      </div>

      <div className="absolute top-6 right-6">
        <motion.button
          onClick={toggleTheme}
          className={`p-2 rounded-full ${
            theme === "dark" ? "bg-gray-700 text-yellow-400" : "bg-gray-200 text-gray-700"
          }`}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          {theme === "dark" ? "☀️ Light" : "🌙 Dark"}
        </motion.button>
      </div>

      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 flex flex-col items-center justify-center bg-black bg-opacity-80 backdrop-blur-sm z-50"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            className="relative w-24 h-24 mb-6"
          >
            <Image
              src="/logo.png"
              alt="Froggy Spinner"
              width={96}
              height={96}
              className="rounded-full border-4 border-green-500 shadow-lg"
            />
          </motion.div>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-2xl font-bold"
          >
            Ribbit! Submitting your form...
          </motion.p>
        </motion.div>
      )}

      <div className="w-full max-w-5xl relative z-0">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className={`relative ${
            theme === "dark" ? "bg-gray-800/80 border-gray-700" : "bg-white/80 border-gray-200"
          } p-8 rounded-2xl shadow-2xl border flex flex-col lg:flex-row mt-16 lg:mt-0 z-20 backdrop-blur-sm`}
        >
          <div className="lg:w-1/2 hidden lg:flex items-center justify-center">
            <Image src={formSideImage} alt="Form Side" width={500} height={500} className="w-full h-auto object-cover" />
          </div>

          <div className="lg:w-1/2 w-full flex flex-col justify-center items-center">
            <h2 className="text-3xl font-bold text-center mb-6 flex items-center">
              Froggy Form
              <Image src="/logo.png" alt="Logo" width={30} height={30} className="ml-2" />
            </h2>
            {!formStatus ? (
              <div className="space-y-6 w-full max-w-md">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className={`${theme === "dark" ? "text-gray-300" : "text-gray-700"} block mb-2`}>
                      Submit your Bitcoin wallet address
                    </label>
                    <input
                      type="text"
                      placeholder="Enter your wallet (bc1p...)"
                      value={wallet}
                      onChange={(e) => {
                        setWallet(e.target.value);
                        validateWallet(e.target.value);
                      }}
                      required
                      className={`w-full p-3 rounded-lg ${
                        theme === "dark"
                          ? "bg-gray-700 text-white border-gray-600 placeholder-gray-400"
                          : "bg-gray-100 text-gray-900 border-gray-300 placeholder-gray-500"
                      } focus:outline-none focus:ring-2 focus:ring-blue-400`}
                    />
                    {walletError && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-red-500 text-sm mt-1"
                      >
                        {walletError}
                      </motion.p>
                    )}
                  </div>

                  <div>
                    <label className={`${theme === "dark" ? "text-gray-300" : "text-gray-700"} block mb-2`}>
                      Your Message
                    </label>
                    <textarea
                      placeholder="Why you love frogs?"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      required
                      className={`w-full p-3 h-24 rounded-lg ${
                        theme === "dark"
                          ? "bg-gray-700 text-white border-gray-600 placeholder-gray-400"
                          : "bg-gray-100 text-gray-900 border-gray-300 placeholder-gray-500"
                      } focus:outline-none focus:ring-2 focus:ring-blue-400`}
                    />
                  </div>

                  <a
                    href={`https://twitter.com/intent/tweet?text=RIBBIT !!! RIBBIT !!! RIBBIT !!!%0A%0AJUST APPLIED FOR @FroggyFolios WL`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center justify-center gap-2 w-full py-3 rounded-lg ${
                      theme === "dark"
                        ? "bg-blue-600 hover:bg-blue-700"
                        : "bg-blue-500 hover:bg-blue-600"
                    } text-white font-semibold`}
                  >
                    <Image src="/x-logo.png" alt="X Logo" width={20} height={20} />
                    Share on X
                  </a>

                  <button
                    type="submit"
                    disabled={loading}
                    className={`w-full py-3 rounded-lg ${
                      theme === "dark"
                        ? "bg-green-600 hover:bg-green-700"
                        : "bg-green-500 hover:bg-green-600"
                    } text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    Submit
                  </button>
                </form>
                <motion.button
                  onClick={handleSignOut}
                  className={`w-full py-3 rounded-lg ${
                    theme === "dark"
                      ? "bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700"
                      : "bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600"
                  } text-white font-semibold`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Sign Out
                </motion.button>
              </div>
            ) : (
              <div className="text-center space-y-4">
                <p className="text-lg font-semibold mb-4">✅ You have already submitted your task.</p>
                <div className="flex flex-col gap-4">
                  <motion.button
                    onClick={handleCheckStatus}
                    className={`py-2 px-6 rounded-lg ${
                      theme === "dark"
                        ? "bg-blue-600 hover:bg-blue-700"
                        : "bg-blue-500 hover:bg-blue-600"
                    } text-white font-semibold`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Check Status
                  </motion.button>
                  <motion.button
                    onClick={handleSignOut}
                    className={`py-2 px-6 rounded-lg ${
                      theme === "dark"
                        ? "bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700"
                        : "bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600"
                    } text-white font-semibold`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Sign Out
                  </motion.button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Submission Popup */}
      <div
        className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm z-50"
        style={{ display: showPopup ? "flex" : "none", transition: "none" }}
      >
        <div
          className={`w-11/12 max-w-md p-4 sm:p-6 ${
            theme === "dark"
              ? "bg-gradient-to-br from-green-700 via-blue-700 to-purple-700"
              : "bg-gradient-to-br from-green-200 via-blue-200 to-purple-200"
          } rounded-2xl shadow-2xl border ${theme === "dark" ? "border-gray-700" : "border-gray-200"} relative overflow-y-auto`}
          style={{
            transition: "none",
            maxHeight: "85vh", // Reduced from 90vh to ensure buttons fit
            minHeight: "auto", // Allow natural height
          }}
        >
          <div className="absolute inset-0 bg-[url('/frog-pattern.png')] opacity-10 pointer-events-none" />
          <div className="w-full flex justify-center">
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 1, repeat: Infinity, repeatType: "loop" }}
            >
              <Image
                src="/emojis/stareye.png"
                alt="Stareye Frog"
                width={0}
                height={0}
                sizes="100vw"
                className="w-2/3 max-w-[150px] sm:max-w-[200px] h-auto drop-shadow-lg"
              />
            </motion.div>
          </div>
          <h3
            className={`text-xl sm:text-2xl font-bold mb-2 text-center ${
              theme === "dark" ? "text-white" : "text-gray-800"
            }`}
          >
            Ribbit! Success!
          </h3>
          <p
            className={`text-sm sm:text-base mb-4 text-center ${
              theme === "dark" ? "text-gray-200" : "text-gray-600"
            }`}
          >
            Your form has been submitted and is{" "}
            <span className="inline-flex items-center">
              <span className="text-green-600 font-extrabold italic">under</span>
              <span className="text-blue-600 font-extrabold underline mx-1">review</span>
            </span>
          </p>
          <button
            onClick={handleTwitterFollow}
            className={`w-full py-2 px-4 ${
              theme === "dark" ? "bg-blue-600 hover:bg-blue-700" : "bg-blue-500 hover:bg-blue-600"
            } text-white rounded-full font-semibold shadow-md hover:shadow-lg flex items-center justify-center gap-2 mb-2 sm:mb-4`}
          >
            <Image src="/x-logo.png" alt="X Logo" width={20} height={20} className="w-5 h-5" />
            Turn on Notification
          </button>
          <button
            onClick={() => setShowPopup(false)}
            className={`w-full py-2 px-4 ${
              theme === "dark" ? "bg-green-600 hover:bg-green-700" : "bg-green-500 hover:bg-green-600"
            } text-white rounded-full font-semibold shadow-md hover:shadow-lg`}
          >
            Close
          </button>
        </div>
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          {showPopup && <Confetti recycle={false} numberOfPieces={200} />}
        </div>
      </div>

      {/* Status Popup */}
      <div
        className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm z-50"
        style={{ display: showStatusPopup ? "flex" : "none", transition: "none" }}
      >
        <div
          className={`w-11/12 max-w-md p-4 sm:p-6 ${
            theme === "dark"
              ? "bg-gradient-to-br from-purple-800 via-blue-800 to-green-800"
              : "bg-gradient-to-br from-purple-200 via-blue-200 to-green-200"
          } rounded-3xl shadow-2xl border ${theme === "dark" ? "border-gray-700" : "border-gray-200"} relative overflow-y-auto`}
          style={{
            transition: "none",
            maxHeight: "85vh", // Reduced to fit small screens
            minHeight: "auto", // Let content dictate height
            position: "relative",
            overflowY: "auto", // Ensure scrolling works
          }}
        >
          <div className="absolute inset-0 bg-[url('/frog-pattern.png')] opacity-5 pointer-events-none" />
          <h3
            className={`text-xl sm:text-2xl font-extrabold mb-4 flex items-center justify-center ${
              getDisplayStatus() === "Approved"
                ? "text-green-600"
                : getDisplayStatus() === "Rejected"
                ? "text-red-600"
                : "text-blue-600"
            }`}
          >
            <div className="w-6 h-6 mr-2">
              <Image src="/logo.png" alt="Froggy Logo" width={24} height={24} className="drop-shadow-lg" />
            </div>
            Form Status
          </h3>

          <div className="w-full mb-4 sm:mb-6">
            <div className="flex justify-between mb-4 text-center gap-2">
              <div className="flex-1">
                {formStatus === "Pending" ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    <Image
                      src="/emojis/tired.png"
                      alt="Pending Frog"
                      width={0}
                      height={0}
                      sizes="100vw"
                      className="w-full max-w-[60px] sm:max-w-[80px] h-auto mx-auto drop-shadow-lg"
                    />
                  </motion.div>
                ) : (
                  <Image
                    src="/emojis/tired.png"
                    alt="Pending Frog"
                    width={0}
                    height={0}
                    sizes="100vw"
                    className="w-full max-w-[60px] sm:max-w-[80px] h-auto mx-auto drop-shadow-lg"
                  />
                )}
                <span className="text-xs font-bold text-yellow-600">Pending</span>
              </div>
              <div className="flex-1">
                {formStatus === "Under Review" ? (
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 1, repeat: Infinity, repeatType: "loop" }}
                  >
                    <Image
                      src="/emojis/underReview.png"
                      alt="Under Review Frog"
                      width={0}
                      height={0}
                      sizes="100vw"
                      className="w-full max-w-[60px] sm:max-w-[80px] h-auto mx-auto drop-shadow-lg"
                    />
                  </motion.div>
                ) : (
                  <Image
                    src="/emojis/underReview.png"
                    alt="Under Review Frog"
                    width={0}
                    height={0}
                    sizes="100vw"
                    className="w-full max-w-[60px] sm:max-w-[80px] h-auto mx-auto drop-shadow-lg"
                  />
                )}
                <span className="text-xs font-bold text-blue-600">Under Review</span>
              </div>
              <div className="flex-1">
                {formStatus === "Approved" ? (
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 1, repeat: Infinity, repeatType: "loop" }}
                  >
                    <Image
                      src="/emojis/celebration.png"
                      alt="Approved Frog"
                      width={0}
                      height={0}
                      sizes="100vw"
                      className="w-full max-w-[60px] sm:max-w-[80px] h-auto mx-auto drop-shadow-lg"
                    />
                  </motion.div>
                ) : formStatus === "Rejected" ? (
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 1, repeat: Infinity, repeatType: "loop" }}
                  >
                    <Image
                      src="/emojis/cry.png"
                      alt="Rejected Frog"
                      width={0}
                      height={0}
                      sizes="100vw"
                      className="w-full max-w-[60px] sm:max-w-[80px] h-auto mx-auto drop-shadow-lg"
                    />
                  </motion.div>
                ) : (
                  <Image
                    src="/emojis/celebration.png"
                    alt="Approved/Rejected Frog"
                    width={0}
                    height={0}
                    sizes="100vw"
                    className="w-full max-w-[60px] sm:max-w-[80px] h-auto mx-auto drop-shadow-lg"
                  />
                )}
                <span className="text-xs font-bold text-green-600">
                  {formStatus === "Approved"
                    ? "Approved"
                    : formStatus === "Rejected"
                    ? "Rejected"
                    : "Approved/Rejected"}
                </span>
              </div>
            </div>
            <div className="relative h-6 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full flex items-center justify-center rounded-full overflow-hidden text-xs text-white text-center whitespace-nowrap ${
                  getDisplayStatus() === "Rejected"
                    ? "bg-red-500"
                    : "bg-gradient-to-r from-yellow-400 via-blue-500 to-green-500"
                }`}
                style={{ width: `${getProgressValue()}%` }}
              >
                {getProgressValue()}%
              </div>
            </div>
          </div>

          {getDisplayStatus() === "Under Review" && (
            <p
              className={`text-sm sm:text-base font-semibold mb-2 sm:mb-4 text-center ${
                theme === "dark" ? "text-blue-300" : "text-blue-700"
              }`}
            >
              Your form is currently{" "}
              <span className="text-blue-500 font-extrabold italic">Under Review</span>!
            </p>
          )}
          {getDisplayStatus() === "Approved" && (
            <div className="text-center">
              <motion.div
                animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.1, 1] }}
                transition={{ duration: 1.2, repeat: Infinity, repeatType: "loop" }}
              >
                <Image
                  src="/emojis/celebration.png"
                  alt="Celebration Frog"
                  width={0}
                  height={0}
                  sizes="100vw"
                  className="w-2/3 max-w-[150px] sm:max-w-[200px] h-auto mx-auto mb-2 sm:mb-4 drop-shadow-lg"
                />
              </motion.div>
              <p className="text-lg sm:text-xl font-bold text-green-600 mb-2">Successfully Approved!</p>
              <p
                className={`text-sm sm:text-base mb-2 sm:mb-4 ${
                  theme === "dark" ? "text-green-300" : "text-green-700"
                }`}
              >
                Congratulations, you are eligible for Froggy WL!
              </p>
              <a
                href={`https://twitter.com/intent/tweet?text=RIBBIT !!! RIBBIT !!!%0A%0AI GOT APPROVED FOR @FroggyFolios WL!`}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center justify-center gap-2 w-full py-2 px-4 rounded-lg ${
                  theme === "dark" ? "bg-blue-600 hover:bg-blue-700" : "bg-blue-500 hover:bg-blue-600"
                } text-white font-semibold shadow-md hover:shadow-lg mb-2 sm:mb-4`}
              >
                <Image src="/x-logo.png" alt="X Logo" width={20} height={20} className="w-5 h-5" />
                Share on X
              </a>
            </div>
          )}
          {getDisplayStatus() === "Rejected" && (
            <div className="text-center">
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 1, repeat: Infinity, repeatType: "loop" }}
              >
                <Image
                  src="/emojis/cry.png"
                  alt="Cry Frog"
                  width={0}
                  height={0}
                  sizes="100vw"
                  className="w-2/3 max-w-[150px] sm:max-w-[200px] h-auto mx-auto mb-2 sm:mb-4 drop-shadow-lg"
                />
              </motion.div>
              <p className="text-lg sm:text-xl font-bold text-red-600 mb-2">Sorry, Rejected</p>
              <p
                className={`text-sm sm:text-base mb-2 sm:mb-4 ${
                  theme === "dark" ? "text-red-300" : "text-red-700"
                }`}
              >
                Try again later.
              </p>
            </div>
          )}

          <button
            onClick={handleTwitterFollow}
            className={`w-full py-2 px-4 ${
              theme === "dark" ? "bg-blue-600 hover:bg-blue-700" : "bg-blue-500 hover:bg-blue-600"
            } text-white rounded-full font-semibold shadow-md hover:shadow-lg flex items-center justify-center gap-2 mb-2 sm:mb-4`}
          >
            <Image src="/x-logo.png" alt="X Logo" width={20} height={20} className="w-5 h-5" />
            Turn on Notification
          </button>
          <button
            onClick={() => setShowStatusPopup(false)}
            className={`w-full py-2 px-4 ${
              theme === "dark" ? "bg-red-600 hover:bg-red-700" : "bg-red-200 hover:bg-red-300"
            } ${theme === "dark" ? "text-white" : "text-red-800"} rounded-full font-semibold shadow-md hover:shadow-lg`}
          >
            Close
          </button>
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              pointerEvents: "none",
              zIndex: 10,
              display: formStatus === "Approved" && showStatusPopup ? "block" : "none",
            }}
          >
            <Confetti
              recycle={false}
              numberOfPieces={200}
              width={400} // Approximate popup width
              height={window.innerHeight * 0.85} // Match maxHeight dynamically
            />
          </div>
        </div>
      </div>
    </div>
  );
}