// Log in Page code untill user restric to fill the form multiple times 
// login.tsx 

"use client";
import { signIn } from "next-auth/react";
import { useState } from "react";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    await signIn("twitter", { callbackUrl: "/form" }); // Redirects after login
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
      <div className="p-6 bg-gray-800 rounded-lg shadow-lg text-center">
        <h2 className="text-2xl font-bold mb-4">Login with Twitter</h2>
        <button
          onClick={handleLogin}
          className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg"
          disabled={loading}
        >
          {loading ? "Logging in..." : "Login with Twitter"}
        </button>
      </div>
    </div>
  );
}


// form.tsx 

"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { motion, AnimatePresence } from "framer-motion";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function TaskForm() {
  const [wallet, setWallet] = useState("");
  const [tweetLink, setTweetLink] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [userSubmission, setUserSubmission] = useState(null);

  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.id) {
      fetchUserSubmission();
    }
  }, [session]);

  const fetchUserSubmission = async () => {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("twitter_id", session.user.id)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching submission:", error);
    } else {
      setUserSubmission(data);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!session?.user?.id || userSubmission) {
      console.error("User already submitted or not logged in");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.from("tasks").insert([
      {
        wallet,
        tweetLink,
        message,
        status: "Pending",
        twitter_id: session.user.id,
        twitterusername: session.user.twitterusername,
      },
    ]);

    setLoading(false);

    if (error) {
      console.error("🚨 Supabase Insert Error:", error);
    } else {
      setShowPopup(true);
      setWallet("");
      setTweetLink("");
      setMessage("");
      fetchUserSubmission();
    }
  };

  if (status === "loading") {
    return <p>Loading...</p>;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#141e30] to-[#243b55] px-4">
      {/* User Info */}
      <div className="text-white text-center mb-6">
        <h1 className="text-2xl font-semibold">Welcome, {session?.user?.twitterusername}!</h1>
        <button onClick={() => signOut()} className="mt-4 px-4 py-2 bg-red-500 rounded-lg">
          Logout
        </button>
      </div>

      {/* Show form only if user hasn't submitted */}
      {!userSubmission ? (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white bg-opacity-10 backdrop-blur-lg p-8 rounded-2xl shadow-2xl max-w-lg w-full border border-gray-500 relative"
        >
          <h2 className="text-3xl font-bold text-white text-center mb-6">
            🚀 Complete Tasks & Get Whitelisted
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-gray-300 mb-2">Wallet Address</label>
              <input
                type="text"
                placeholder="Enter your wallet"
                value={wallet}
                onChange={(e) => setWallet(e.target.value)}
                required
                className="w-full p-3 rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 border border-gray-700 transition-all duration-300"
              />
            </div>

            <div>
              <label className="block text-gray-300 mb-2">Tweet Link</label>
              <input
                type="text"
                placeholder="Paste your Tweet link"
                value={tweetLink}
                onChange={(e) => setTweetLink(e.target.value)}
                required
                className="w-full p-3 rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 border border-gray-700 transition-all duration-300"
              />
            </div>

            <div>
              <label className="block text-gray-300 mb-2">Your Message</label>
              <textarea
                placeholder="Write something good about Ordinals..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                className="w-full p-3 h-24 rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 border border-gray-700 transition-all duration-300"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold transition transform hover:scale-105 hover:shadow-lg hover:shadow-blue-500/50 focus:outline-none"
            >
              {loading ? <span className="animate-pulse">Submitting...</span> : "Submit Task"}
            </button>
          </form>
        </motion.div>
      ) : (
        <div className="text-white text-center mt-4">
          <p className="text-lg font-semibold mb-4">You have already submitted your task. ✅</p>
          <button
            onClick={fetchUserSubmission}
            className="px-6 py-3 bg-green-500 text-white rounded-lg text-lg font-semibold hover:bg-green-600 transition"
          >
            Check Status
          </button>
        </div>
      )}

      {/* Success Popup */}
      <AnimatePresence>
        {showPopup && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-lg"
          >
            <motion.div
              initial={{ y: 20 }}
              animate={{ y: 0 }}
              exit={{ y: 20 }}
              className="bg-gray-900 text-white p-6 rounded-lg shadow-xl text-center border border-blue-500"
            >
              <h3 className="text-lg font-semibold">✅ Submitted Successfully!</h3>
              <p className="text-gray-400">Your task is under review.</p>
              <button
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg transition hover:bg-blue-600"
                onClick={() => setShowPopup(false)}
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* User Submission Status */}
      {userSubmission && (
        <div className="mt-10 bg-white bg-opacity-10 p-6 rounded-2xl shadow-lg max-w-lg w-full border border-gray-500">
          <h2 className="text-white text-xl font-semibold mb-4">Your Submission</h2>
          <p><b>Wallet:</b> {userSubmission.wallet}</p>
          <p><b>Tweet:</b> {userSubmission.tweetLink}</p>
          <p><b>Status:</b> <span className="font-bold text-yellow-400">{userSubmission.status}</span></p>
        </div>
      )}
    </div>
  );
}


// compoents/sessionProvider.tsx

"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";

export default function SessionProvider({ children }: { children: React.ReactNode }) {
  return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>;
}






callback/page. tsx code 

"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleAuth = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error("🚨 Session Error:", error.message);
        return;
      }

      if (data.session) {
        const { user } = data.session;
        if (user) {
          const { error: insertError } = await supabase.from("users").upsert({
            id: user.id,
            twitter_username: user.user_metadata?.user_name || "",
          });
          if (insertError) {
            console.error("🚨 Database Insert Error:", insertError.message);
          }
        }
        router.push("/form");
      }
    };
    handleAuth();
  }, [router]);

  return (
    <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
      <p>Authenticating...</p>
    </div>
  );
} 