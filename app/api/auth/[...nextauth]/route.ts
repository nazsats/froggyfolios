import NextAuth from "next-auth";
import TwitterProvider from "next-auth/providers/twitter";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

console.log("✅ Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log("✅ Supabase Role Key:", process.env.SUPABASE_SERVICE_ROLE_KEY ? "Loaded" : "Not Found");

export const authOptions = {
  providers: [
    TwitterProvider({
      clientId: process.env.TWITTER_CLIENT_ID!,
      clientSecret: process.env.TWITTER_CLIENT_SECRET!,
      version: "2.0",
      profile(profile) {
        console.log("Twitter Profile Data:", profile);
        return {
          id: profile.data.id,
          username: profile.data.username, // Twitter handle
          name: profile.data.name,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      console.log("User signing in:", user);
      const { error } = await supabaseAdmin.from("users").upsert([
        {
          id: user.id,
          twitter_username: user.username,
        },
      ]);
      if (error) console.error("🚨 Supabase Insert Error:", error);
      return true;
    },
    async session({ session, token }) {
      console.log("Token:", token);
      session.user.id = token.sub;
      session.user.twitterusername = token.username; // Ensure this is set
      session.expires = token.exp || session.expires;
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };