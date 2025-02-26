"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";

export default function AdminPanel() {
  const [submissions, setSubmissions] = useState([]);
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedMessages, setExpandedMessages] = useState({});
  const entriesPerPage = 20;
  const router = useRouter();

  useEffect(() => {
    if (authenticated) fetchSubmissions();
  }, [authenticated, currentPage]);

  const fetchSubmissions = async () => {
    setLoading(true);
    const { data: tasksData, error: tasksError } = await supabase
      .from("tasks")
      .select("*")
      .order("id", { ascending: true })
      .range((currentPage - 1) * entriesPerPage, currentPage * entriesPerPage - 1);

    if (tasksError) {
      console.error("Error fetching tasks:", tasksError);
      setSubmissions([]);
      setLoading(false);
      return;
    }

    const submissionsWithUsernames = await Promise.all(
      tasksData.map(async (task) => {
        const username = await fetchTwitterUsername(task.twitter_id);
        return {
          ...task,
          twitterUsername: username || `ID_${task.twitter_id}`, // Improved fallback
        };
      })
    );

    setSubmissions(submissionsWithUsernames);
    setLoading(false);
  };

  const fetchTwitterUsername = async (twitterId) => {
    try {
      const response = await fetch(`/api/twitterUsername/${twitterId}`);
      const data = await response.json();
      if (response.ok && data.username) {
        return data.username;
      }
      console.error(`Error fetching username for ID ${twitterId}:`, data.error, data.details);
      return null;
    } catch (error) {
      console.error(`Fetch error details for ID ${twitterId}:`, error.message);
      return null;
    }
  };

  const updateStatus = async (id, newStatus) => {
    setLoading(true);
    await supabase.from("tasks").update({ status: newStatus }).eq("id", id);
    fetchSubmissions();
    setSelectedSubmission(null);
  };

  const handleDeleteUser = async (id) => {
    if (confirm("Are you sure you want to delete this user?")) {
      setLoading(true);
      await supabase.from("tasks").delete().eq("id", id);
      fetchSubmissions();
      setSelectedSubmission(null);
    }
  };

  const handleAuth = () => {
    if (password === process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      setAuthenticated(true);
    } else {
      alert("Incorrect password");
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .ilike("twitterusername", `%${searchQuery}%`)
      .single();

    if (!error && data) {
      const username = await fetchTwitterUsername(data.twitter_id);
      setSelectedSubmission({
        ...data,
        twitterUsername: username || `ID_${data.twitter_id}`,
      });
    } else {
      alert("No user found with that username.");
    }
    setLoading(false);
  };

  const toggleMessage = (id) => {
    setExpandedMessages((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const totalEntries = submissions.length;
  const totalPages = Math.ceil(totalEntries / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;
  const paginatedSubmissions = submissions.slice(startIndex, endIndex);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-500 via-blue-500 via-purple-500 via-pink-500 to-yellow-500 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="p-8 bg-gray-900 rounded-2xl shadow-2xl border border-gray-500 text-center max-w-md w-full"
        >
          <h2 className="text-3xl font-bold text-white mb-6 flex items-center justify-center">
            Admin Login
            <Image src="/logo.png" alt="Froggy Logo" width={30} height={30} className="ml-2" />
          </h2>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter Admin Password"
            className="p-3 mt-4 bg-gray-800 text-white placeholder-gray-400 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-400 border border-gray-700 transition-all duration-300"
          />
          <button
            onClick={handleAuth}
            className="mt-6 py-3 px-8 bg-green-500 rounded-lg text-white font-semibold hover:bg-green-600 transition transform hover:scale-105 hover:shadow-lg hover:shadow-green-500/50"
          >
            Login
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-green-500 via-blue-500 via-purple-500 via-pink-500 to-yellow-500 px-4 font-sans relative">
      <div className="absolute top-6 left-6 flex items-center text-white text-2xl font-bold">
        <Image src="/logo.png" alt="Froggy Logo" width={30} height={30} className="ml-2" />
        <span>Froggy Admin Panel</span>
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
            Ribbit! Loading...
          </motion.p>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-6xl mx-auto mt-20 p-8 bg-gray-900 rounded-2xl shadow-2xl border border-gray-500"
      >
        <h2 className="text-4xl font-bold text-white mb-4 flex items-center">
          Admin Dashboard
          <Image src="/logo.png" alt="Froggy Logo" width={30} height={30} className="ml-2" />
        </h2>
        <p className="text-white text-lg mb-8">Total Entries: {totalEntries}</p>

        <div className="mb-8">
          <h3 className="text-2xl font-semibold text-white mb-4">Search User</h3>
          <form onSubmit={handleSearch} className="flex gap-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Enter Twitter username"
              className="p-3 bg-gray-800 text-white placeholder-gray-400 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-400 border border-gray-700 transition-all duration-300"
            />
            <button
              type="submit"
              className="py-3 px-6 bg-blue-500 rounded-lg text-white font-semibold hover:bg-blue-600 transition transform hover:scale-105 hover:shadow-lg hover:shadow-blue-500/50"
            >
              Search
            </button>
          </form>
        </div>

        <div className="w-full">
          <table className="w-full border-collapse border border-gray-700 text-left text-white">
            <thead>
              <tr className="bg-gray-800">
                {["Username", "Wallet", "Message", "Status", "Actions"].map((heading) => (
                  <th key={heading} className="border-b-2 border-gray-600 p-4 font-bold">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedSubmissions.map((submission) => (
                <tr key={submission.id} className="bg-gray-700 hover:bg-gray-600 transition">
                  <td className="border border-gray-600 p-4">{submission.twitterUsername || "N/A"}</td>
                  <td className="border border-gray-600 p-4 break-all">{submission.wallet}</td>
                  <td className="border border-gray-600 p-4">
                    {submission.message.length > 50 && !expandedMessages[submission.id] ? (
                      <>
                        {submission.message.slice(0, 50)}...
                        <button
                          onClick={() => toggleMessage(submission.id)}
                          className="text-blue-400 underline ml-2 text-sm"
                        >
                          Show More
                        </button>
                      </>
                    ) : (
                      <>
                        {submission.message}
                        {submission.message.length > 50 && (
                          <button
                            onClick={() => toggleMessage(submission.id)}
                            className="text-blue-400 underline ml-2 text-sm"
                          >
                            Show Less
                          </button>
                        )}
                      </>
                    )}
                  </td>
                  <td className="border border-gray-600 p-4 font-semibold text-yellow-400">{submission.status}</td>
                  <td className="border border-gray-600 p-4">
                    <div className="flex flex-wrap gap-2">
                      <motion.button
                        onClick={() => updateStatus(submission.id, "Approved")}
                        className="px-2 py-1 bg-green-500 text-white text-sm font-semibold rounded hover:bg-green-600 transition transform hover:scale-105"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Approve
                      </motion.button>
                      <motion.button
                        onClick={() => updateStatus(submission.id, "Rejected")}
                        className="px-2 py-1 bg-red-500 text-white text-sm font-semibold rounded hover:bg-red-600 transition transform hover:scale-105"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Reject
                      </motion.button>
                      <motion.button
                        onClick={() => handleDeleteUser(submission.id)}
                        className="px-2 py-1 bg-red-700 text-white text-sm font-semibold rounded hover:bg-red-800 transition transform hover:scale-105"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Delete
                      </motion.button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-between items-center mt-6">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="py-2 px-4 bg-gray-700 text-white rounded-lg font-semibold hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Previous
            </button>
            <span className="text-white">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="py-2 px-4 bg-gray-700 text-white rounded-lg font-semibold hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Next
            </button>
          </div>
        </div>
      </motion.div>

      {selectedSubmission && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm z-50">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, type: "spring" }}
            className="max-w-md w-full p-8 bg-gradient-to-br from-purple-100 via-blue-100 to-green-100 rounded-3xl shadow-2xl border border-gray-300 flex flex-col items-center justify-center relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-[url('/frog-pattern.png')] opacity-5 pointer-events-none" />
            <h3 className="text-3xl font-extrabold text-purple-700 mb-6 flex items-center">
              <Image src="/logo.png" alt="Froggy Logo" width={30} height={30} className="mr-2" />
              User Details
            </h3>
            <div className="w-full text-gray-800 space-y-4">
              <p><strong>Username:</strong> {selectedSubmission.twitterUsername || "N/A"}</p>
              <p><strong>Wallet:</strong> {selectedSubmission.wallet}</p>
              <p><strong>Message:</strong> {selectedSubmission.message}</p>
              <p><strong>Status:</strong> <span className="text-yellow-600 font-semibold">{selectedSubmission.status}</span></p>
            </div>
            <div className="flex flex-wrap gap-2 mt-6">
              <motion.button
                onClick={() => updateStatus(selectedSubmission.id, "Approved")}
                className="px-2 py-1 bg-green-500 text-white text-sm font-semibold rounded hover:bg-green-600 transition transform hover:scale-105"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Approve
              </motion.button>
              <motion.button
                onClick={() => updateStatus(selectedSubmission.id, "Rejected")}
                className="px-2 py-1 bg-red-500 text-white text-sm font-semibold rounded hover:bg-red-600 transition transform hover:scale-105"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Reject
              </motion.button>
              <motion.button
                onClick={() => handleDeleteUser(selectedSubmission.id)}
                className="px-2 py-1 bg-red-700 text-white text-sm font-semibold rounded hover:bg-red-800 transition transform hover:scale-105"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Delete
              </motion.button>
            </div>
            <button
              onClick={() => setSelectedSubmission(null)}
              className="mt-6 px-6 py-2 bg-gray-200 text-gray-800 rounded-full font-semibold hover:bg-gray-300 transition-all shadow-md hover:shadow-lg"
            >
              Close
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}