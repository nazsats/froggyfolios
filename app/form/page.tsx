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
  const [walletError, setWalletError] = useState(""); // New state for wallet error message
  const [loading, setLoading] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [showStatusPopup, setShowStatusPopup] = useState(false);
  const [formStatus, setFormStatus] = useState<FormStatus>(null);

  const { data: session, status } = useSession();
  const router = useRouter();

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
      default: // "Pending", "Under Review", null
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-green-500 via-blue-500 via-purple-500 via-pink-500 to-yellow-500">
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
          className="text-2xl font-bold text-white"
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
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-gradient-to-br from-green-500 via-blue-500 via-purple-500 via-pink-500 to-yellow-500 relative font-sans">
      <div className="absolute top-6 left-6 flex items-center text-white text-2xl font-bold">
        <Image src="/logo.png" alt="Froggy Logo" width={30} height={30} className="ml-2" />
        <span>Froggy Whitelist</span>
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
            className="text-2xl font-bold text-white"
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
          className="relative bg-gray-900 p-8 rounded-2xl shadow-2xl border border-gray-500 flex flex-col lg:flex-row mt-16 lg:mt-0 z-20"
        >
          <div className="lg:w-1/2 hidden lg:flex items-center justify-center">
            <Image src={formSideImage} alt="Form Side" width={500} height={500} className="w-full h-auto object-cover" />
          </div>

          <div className="lg:w-1/2 w-full flex flex-col justify-center items-center">
            <h2 className="text-3xl font-bold text-white text-center mb-6 flex items-center">
              Froggy Form
              <Image src="/logo.png" alt="Logo" width={30} height={30} className="ml-2" />
            </h2>
            {!formStatus ? (
              <div className="space-y-6 w-full max-w-md">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-gray-300 mb-2">Submit your Bitcoin wallet address</label>
                    <input
                      type="text"
                      placeholder="Enter your wallet (bc1p...)"
                      value={wallet}
                      onChange={(e) => {
                        setWallet(e.target.value);
                        validateWallet(e.target.value);
                      }}
                      required
                      className="w-full p-3 rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 border border-gray-700 transition-all duration-300"
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
                    <label className="block text-gray-300 mb-2">Your Message</label>
                    <textarea
                      placeholder="Why you love frogs?"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      required
                      className="w-full p-3 h-24 rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 border border-gray-700 transition-all duration-300"
                    />
                  </div>

                  <a
                    href={`https://twitter.com/intent/tweet?text=RIBBIT !!! RIBBIT !!! RIBBIT !!!%0A%0AJUST APPLIED FOR @FroggyFolios WL`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-lg bg-blue-400 text-white font-semibold transition transform hover:scale-105 hover:shadow-lg hover:shadow-blue-500/50 focus:outline-none"
                  >
                    <Image src="/x-logo.png" alt="X Logo" width={20} height={20} />
                    Share on X
                  </a>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-lg bg-green-500 text-white font-semibold transition transform hover:scale-105 hover:shadow-lg hover:shadow-green-500/50 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Submit
                  </button>
                </form>
                <motion.button
                  onClick={handleSignOut}
                  className="w-full py-3 rounded-lg bg-gradient-to-r from-red-500 to-pink-500 text-white font-semibold transition transform hover:scale-105 hover:shadow-lg hover:shadow-red-500/50 focus:outline-none"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Sign Out
                </motion.button>
              </div>
            ) : (
              <div className="text-center space-y-4">
                <p className="text-white text-lg font-semibold mb-4">✅ You have already submitted your task.</p>
                <div className="flex flex-col gap-4">
                  <motion.button
                    onClick={handleCheckStatus}
                    className="py-2 px-6 rounded-lg bg-blue-500 text-white font-semibold transition transform hover:scale-105 hover:shadow-lg hover:shadow-blue-500/50 focus:outline-none"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Check Status
                  </motion.button>
                  <motion.button
                    onClick={handleSignOut}
                    className="py-2 px-6 rounded-lg bg-gradient-to-r from-red-500 to-pink-500 text-white font-semibold transition transform hover:scale-105 hover:shadow-lg hover:shadow-red-500/50 focus:outline-none"
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

      {/* Popup for Form Submission with stareye.png */}
      {showPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="max-w-md w-full p-8 bg-gradient-to-br from-green-500 via-white to-blue-100 rounded-2xl shadow-2xl border border-gray-200 relative overflow-hidden flex flex-col items-center justify-center"
          >
            <div className="absolute inset-0 bg-[url('/frog-pattern.png')] opacity-10 pointer-events-none" />
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 1, repeat: Infinity, repeatType: "loop" }}
            >
              <Image
                src="/emojis/stareye.png"
                alt="Stareye Frog"
                width={300}
                height={300}
                className="drop-shadow-lg"
              />
            </motion.div>
            <h3 className="text-3xl font-bold text-gray-800 mb-2 text-center">Ribbit! Success!</h3>
            <p className="text-gray-600 text-lg mb-4 text-center">
              Your form has been submitted and is{" "}
              <span className="inline-flex items-center">
                <span className="text-green-600 font-extrabold italic">under</span>
                <span className="text-blue-600 font-extrabold underline mx-1">review</span>
              </span>
            </p>
            <motion.button
              onClick={handleTwitterFollow}
              className="px-8 py-2 bg-blue-500 text-white rounded-full font-semibold hover:bg-blue-600 transition-all shadow-md hover:shadow-lg flex items-center gap-2 mb-4"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Image src="/x-logo.png" alt="X Logo" width={20} height={20} />
              Turn on Notification
            </motion.button>
            <button
              onClick={() => setShowPopup(false)}
              className="px-8 py-2 bg-green-500 text-white rounded-full font-semibold hover:bg-green-600 transition-all shadow-md hover:shadow-lg"
            >
              Close
            </button>
          </motion.div>
          <Confetti recycle={false} numberOfPieces={200} />
        </div>
      )}

      {/* Status Popup */}
      {showStatusPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm z-50">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, type: "spring" }}
            className="max-w-md w-full p-8 bg-gradient-to-br from-purple-100 via-blue-100 to-green-100 rounded-3xl shadow-2xl border border-gray-300 flex flex-col items-center justify-center relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-[url('/frog-pattern.png')] opacity-5 pointer-events-none" />
            <h3
              className={`text-3xl font-extrabold mb-6 flex items-center ${
                getDisplayStatus() === "Approved"
                  ? "text-green-600"
                  : getDisplayStatus() === "Rejected"
                  ? "text-red-600"
                  : "text-blue-600"
              }`}
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.8, repeat: Infinity, repeatType: "loop" }}
                className="w-8 h-8 mr-2"
              >
                <Image
                  src="/logo.png"
                  alt="Froggy Logo"
                  width={32}
                  height={32}
                  className="drop-shadow-lg"
                />
              </motion.div>
              Form Status
            </h3>

            <div className="w-full mb-8">
              <div className="flex justify-between mb-4 text-center">
                {/* Progress Bar Emojis Above */}
                <div>
                  {formStatus === "Pending" ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    >
                      <Image
                        src="/emojis/tired.png"
                        alt="Pending Frog"
                        width={120}
                        height={120}
                        className="mx-auto drop-shadow-lg"
                      />
                    </motion.div>
                  ) : (
                    <Image
                      src="/emojis/tired.png"
                      alt="Pending Frog"
                      width={120}
                      height={120}
                      className="mx-auto drop-shadow-lg"
                    />
                  )}
                  <span className="text-sm font-bold text-yellow-600">Pending</span>
                </div>
                <div>
                  {formStatus === "Under Review" ? (
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 1, repeat: Infinity, repeatType: "loop" }}
                    >
                      <Image
                        src="/emojis/underReview.png"
                        alt="Under Review Frog"
                        width={120}
                        height={120}
                        className="mx-auto drop-shadow-lg"
                      />
                    </motion.div>
                  ) : (
                    <Image
                      src="/emojis/underReview.png"
                      alt="Under Review Frog"
                      width={120}
                      height={120}
                      className="mx-auto drop-shadow-lg"
                    />
                  )}
                  <span className="text-sm font-bold text-blue-600">Under Review</span>
                </div>
                <div>
                  {(formStatus === "Approved" || formStatus === "Rejected") ? (
                    <motion.div
                      animate={{ y: [0, -10, 0] }}
                      transition={{ duration: 1, repeat: Infinity, repeatType: "loop" }}
                    >
                      <Image
                        src="/emojis/celebration.png"
                        alt="Approved/Rejected Frog"
                        width={120}
                        height={120}
                        className="mx-auto drop-shadow-lg"
                      />
                    </motion.div>
                  ) : (
                    <Image
                      src="/emojis/celebration.png"
                      alt="Approved/Rejected Frog"
                      width={120}
                      height={120}
                      className="mx-auto drop-shadow-lg"
                    />
                  )}
                  <span className="text-sm font-bold text-green-600">Approved/Rejected</span>
                </div>
              </div>
              {/* Progress Bar with Percentage Inside */}
              <div className="relative h-8 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${getProgressValue()}%` }}
                  transition={{ duration: 1.5, ease: "easeInOut" }}
                  className={`h-full flex items-center justify-center rounded-full overflow-hidden text-xs text-white text-center whitespace-nowrap transition-all duration-500 ${
                    getDisplayStatus() === "Rejected"
                      ? "bg-red-500"
                      : "bg-gradient-to-r from-yellow-400 via-blue-500 to-green-500"
                  }`}
                >
                  {getProgressValue()}%
                </motion.div>
              </div>
            </div>

            {getDisplayStatus() === "Under Review" && (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-lg text-blue-700 font-semibold mb-6 text-center"
              >
                Your form is currently{" "}
                <span className="text-blue-500 font-extrabold italic">Under Review</span>!
              </motion.p>
            )}
            {getDisplayStatus() === "Approved" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
              >
                <motion.div
                  animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.1, 1] }}
                  transition={{ duration: 1.2, repeat: Infinity, repeatType: "loop" }}
                >
                  <Image
                    src="/emojis/celebration.png"
                    alt="Celebration Frog"
                    width={300}
                    height={300}
                    className="mx-auto mb-4 drop-shadow-lg"
                  />
                </motion.div>
                <p className="text-2xl font-bold text-green-600 mb-2">Successfully Approved!</p>
                <p className="text-lg text-green-700 mb-4">
                  Congratulations, you are eligible for Froggy WL!
                </p>
                <a
                  href={`https://twitter.com/intent/tweet?text=RIBBIT !!! RIBBIT !!!%0A%0AI GOT APPROVED FOR @FroggyFolios WL!`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-lg bg-blue-500 text-white font-semibold transition transform hover:scale-105 hover:shadow-lg hover:shadow-blue-500/50 mb-4"
                >
                  <Image src="/x-logo.png" alt="X Logo" width={20} height={20} />
                  Share on X
                </a>
              </motion.div>
            )}
            {getDisplayStatus() === "Rejected" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
              >
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 1, repeat: Infinity, repeatType: "loop" }}
                >
                  <Image
                    src="/emojis/tired.png"
                    alt="Tired Frog"
                    width={300}
                    height={300}
                    className="mx-auto mb-4 drop-shadow-lg"
                  />
                </motion.div>
                <p className="text-2xl font-bold text-red-600 mb-2">Sorry, Rejected</p>
                <p className="text-lg text-red-700 mb-6">Try again later.</p>
              </motion.div>
            )}

            <motion.button
              onClick={handleTwitterFollow}
              className="px-8 py-2 bg-blue-500 text-white rounded-full font-semibold hover:bg-blue-600 transition-all shadow-md hover:shadow-lg flex items-center gap-2 mb-4"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Image src="/x-logo.png" alt="X Logo" width={20} height={20} />
              Turn on Notification
            </motion.button>
            <button
              onClick={() => setShowStatusPopup(false)}
              className="px-8 py-2 bg-red-200 text-red-800 rounded-full font-semibold hover:bg-red-300 transition-all shadow-md hover:shadow-lg"
            >
              Close
            </button>
          </motion.div>
          {formStatus === "Approved" && <Confetti recycle={false} numberOfPieces={300} />}
        </div>
      )}
    </div>
  );
}