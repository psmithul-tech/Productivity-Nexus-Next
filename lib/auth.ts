import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { db, usersTable } from "@/lib/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "openid email profile https://www.googleapis.com/auth/calendar.readonly",
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const [user] = await db
          .select()
          .from(usersTable)
          .where(eq(usersTable.email, credentials.email as string));
        if (!user || !user.passwordHash) return null;
        const valid = await bcrypt.compare(credentials.password as string, user.passwordHash);
        if (!valid) return null;
        return { id: String(user.id), email: user.email, name: user.name, image: user.picture };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        const email = user.email!;
        const googleId = profile?.sub!;
        const picture = user.image ?? null;
        const name = user.name ?? email;

        const [existing] = await db.select().from(usersTable).where(eq(usersTable.googleId, googleId));
        if (existing) {
          await db.update(usersTable).set({ picture, name, accessToken: account.access_token ?? null, refreshToken: account.refresh_token ?? existing.refreshToken }).where(eq(usersTable.googleId, googleId));
          user.id = String(existing.id);
          return true;
        }
        const [byEmail] = await db.select().from(usersTable).where(eq(usersTable.email, email));
        if (byEmail) {
          await db.update(usersTable).set({ googleId, picture, name, accessToken: account.access_token ?? null }).where(eq(usersTable.id, byEmail.id));
          user.id = String(byEmail.id);
          return true;
        }
        const [newUser] = await db.insert(usersTable).values({ googleId, email, name, picture, accessToken: account.access_token ?? null, refreshToken: account.refresh_token ?? null }).returning();
        user.id = String(newUser.id);
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user?.id) token.uid = user.id;
      return token;
    },
    async session({ session, token }) {
      if (token.uid) (session.user as any).id = token.uid;
      return session;
    },
  },
});
