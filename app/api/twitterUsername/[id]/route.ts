// app/api/twitterUsername/[id]/route.js
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  const { id } = params;
  const token = process.env.TWITTER_BEARER_TOKEN;

  if (!token) {
    console.error("TWITTER_BEARER_TOKEN not set in environment");
    return NextResponse.json({ username: null, error: "Bearer token missing" }, { status: 500 });
  }

  try {
    const response = await fetch(`https://api.twitter.com/2/users/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await response.json();
    if (response.ok && data.data) {
      console.log(`Successfully fetched username for ID ${id}:`, data.data.username);
      return NextResponse.json({ username: `@${data.data.username}` });
    }
    console.error(`Twitter API error for ID ${id}:`, {
      status: response.status,
      statusText: response.statusText,
      data,
    });
    return NextResponse.json(
      { username: null, error: `Twitter API failed: ${response.status} - ${response.statusText}`, details: data },
      { status: response.status }
    );
  } catch (error) {
    console.error(`Fetch error for ID ${id}:`, error.message);
    return NextResponse.json(
      { username: null, error: "Network or fetch error", details: error.message },
      { status: 500 }
    );
  }
}