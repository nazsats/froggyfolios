// /pages/api/twitterUsername/[id].ts
import { NextApiRequest, NextApiResponse } from "next";

interface TwitterUserResponse {
  data?: {
    username: string;
  };
  errors?: { message: string }[];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { id } = req.query as { id: string };
  const token = process.env.TWITTER_BEARER_TOKEN;

  const response = await fetch(`https://api.twitter.com/2/users/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  
  console.log("Rate Limit Remaining:", response.headers.get("x-rate-limit-remaining"));
  console.log("Rate Limit Reset:", new Date(parseInt(response.headers.get("x-rate-limit-reset")!) * 1000));


  if (!token) {
    console.error("TWITTER_BEARER_TOKEN not set in environment");
    return res.status(500).json({ username: null, error: "Bearer token missing" });
  }

  try {
    const response = await fetch(`https://api.twitter.com/2/users/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const data: TwitterUserResponse = await response.json();

    if (response.ok && data.data) {
      console.log(`Successfully fetched username for ID ${id}:`, data.data.username);
      return res.status(200).json({ username: `@${data.data.username}` });
    }

    const errorMessage = data.errors?.[0]?.message || "Unknown Twitter API error";
    console.error(`Twitter API error for ID ${id}:`, {
      status: response.status,
      statusText: response.statusText,
      data,
    });
    return res.status(response.status).json({
      username: null,
      error: `Twitter API failed: ${response.status} - ${errorMessage}`,
      details: data,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(`Fetch error for ID ${id}:`, errorMessage);
    return res.status(500).json({
      username: null,
      error: "Network or fetch error",
      details: errorMessage,
    });
  }
}