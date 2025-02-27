// app/api/auth/[...nextauth]/route.ts
import NextAuth, { NextAuthOptions } from "next-auth";
import TwitterProvider from "next-auth/providers/twitter";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

declare module "next-auth" {
  interface User {
    twitter_username?: string;
  }
  interface Session {
    customUser: {
      id: string;
      twitter_username?: string;
    };
  }
  interface Profile {
    username?: string; // For OAuth 2.0 direct structure
    data?: {
      username: string;
      id: string;
      name: string;
      profile_image_url?: string;
    };
  }
}

const authOptions: NextAuthOptions = {
  providers: [
    TwitterProvider({
      clientId: process.env.TWITTER_CLIENT_ID!,
      clientSecret: process.env.TWITTER_CLIENT_SECRET!,
      version: "2.0",
      authorization: { url: "https://twitter.com/i/oauth2/authorize", params: { scope: "tweet.read users.read" } },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user, profile }) {
      console.log("SignIn Start - User:", user);
      console.log("SignIn Start - Profile:", JSON.stringify(profile, null, 2)); // Full profile log
      const twitterUsername = profile?.data?.username || profile?.username; // Try both structures
      console.log("Extracted Twitter Username:", twitterUsername);

      if (!twitterUsername) {
        console.error("No Twitter username found in profile.data or profile.username");
        return false; // Triggers AccessDenied
      }

      try {
        console.log("Attempting Supabase upsert for user:", user.id);
        const { data, error } = await supabaseAdmin.from("users").upsert([
          { id: user.id, twitter_username: twitterUsername },
        ]);
        if (error) {
          console.error("Supabase Insert Error:", error);
          return false;
        }
        console.log("Supabase Insert Success:", data);
        return true;
      } catch (err) {
        console.error("SignIn Unexpected Error:", err instanceof Error ? err.message : err);
        return false;
      }
    },
    async session({ session, token }) {
      console.log("Session Callback - Token:", token);
      try {
        const { data, error } = await supabaseAdmin
          .from("users")
          .select("twitter_username")
          .eq("id", token.sub)
          .single();
        if (error) console.error("Supabase Select Error:", error);
        session.customUser = {
          id: token.sub!,
          twitter_username: data?.twitter_username,
        };
        console.log("Session Callback - Session:", session);
        return session;
      } catch (err) {
        console.error("Session Error:", err instanceof Error ? err.message : err);
        session.customUser = { id: token.sub!, twitter_username: undefined };
        return session;
      }
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };