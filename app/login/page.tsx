"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import frogJumpImage from "@/public/frog-jump.png"; // Import the frog image

export default function LoginPage() {
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    await signIn("twitter", { callbackUrl: "/form" }); // Redirects after login
    // Note: setLoading(false) may not execute due to redirect, but included for clarity
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-gradient-to-br from-green-500 via-blue-500 via-purple-500 via-pink-500 to-yellow-500 relative font-sans">
      {/* Logo in Top Left */}
      <div className="absolute top-6 left-6 flex items-center text-white text-2xl font-bold">
        <Image src="/logo.png" alt="Froggy Logo" width={30} height={30} className="ml-2" />
        <span>Froggy Whitelist</span>
      </div>

      {/* Full-Screen Loader */}
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
            Ribbit! Hopping to your form...
          </motion.p>
        </motion.div>
      )}

      {/* Login Section with Overlapping Frog Image */}
      <div className="w-full max-w-md relative">
        {/* Frog Image Overlapping - Hidden on Large Screens */}
        <div className="absolute top-[-60px] left-0 w-full h-32 lg:hidden z-10">
          <Image
            src={frogJumpImage}
            alt="Frog Jump"
            layout="fill"
            objectFit="cover"
            objectPosition="center"
          />
        </div>

        {/* Login Container */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative bg-gray-900 p-8 rounded-2xl shadow-2xl border border-gray-500 mt-16 lg:mt-0"
        >
          <h2 className="text-3xl font-bold text-white text-center mb-6 flex items-center justify-center">
            Froggy Login
            <Image src="/logo.png" alt="Logo" width={30} height={30} className="ml-2" />
          </h2>

          <p className="text-gray-300 text-center mb-6">Hop in with your Twitter account!</p>

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full py-3 px-4 rounded-lg bg-blue-500 text-white font-semibold flex items-center justify-center gap-2 transition transform hover:scale-105 hover:shadow-lg hover:shadow-blue-500/50 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Image src="/x-logo.png" alt="X Logo" width={20} height={20} />
            Login with Twitter
          </button>
        </motion.div>
      </div>
    </div>
  );
}