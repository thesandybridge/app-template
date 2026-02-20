import NextAuth from "next-auth";
import pool from "@/lib/db";
import authConfig from "@/auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  callbacks: {
    async jwt({ token, trigger, account, profile }) {
      if (trigger === "signIn" && account?.provider === "github" && profile) {
        const githubId = Number(profile.id);
        const username = (profile.login as string) ?? profile.name ?? "";
        const avatarUrl = (profile.avatar_url as string) ?? profile.image ?? "";
        const email = profile.email ?? null;

        // Upsert user in Postgres
        const result = await pool.query(
          `INSERT INTO users (github_id, username, avatar_url, email)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (github_id) DO UPDATE
             SET username = EXCLUDED.username,
                 avatar_url = EXCLUDED.avatar_url,
                 email = EXCLUDED.email,
                 updated_at = now()
           RETURNING id`,
          [githubId, username, avatarUrl, email],
        );

        const row = result.rows[0];
        token.userId = row.id;
        token.username = username;
        token.avatarUrl = avatarUrl;
        token.sub = row.id;
      }

      return token;
    },
    async session({ session, token }) {
      if (token.userId) {
        session.user.id = token.userId as string;
        session.user.username = (token.username as string) ?? "";
        session.user.image = (token.avatarUrl as string) ?? null;
      }
      return session;
    },
  },
});
