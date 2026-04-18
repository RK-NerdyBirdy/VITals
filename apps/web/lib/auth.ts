import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

const allowedAdminEmails = (process.env.ADMIN_EMAILS ?? "robomaneet@gmail.com")
  .split(",")
  .map((value) => value.trim().toLowerCase())
  .filter(Boolean);

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user }) {
      const email = (user.email ?? "").toLowerCase();
      const isDomainAllowed =
        email.endsWith("@vitstudent.ac.in") ||
        email.endsWith("@vit.ac.in") ||
        allowedAdminEmails.includes(email);
      return isDomainAllowed;
    },
    async jwt({ token, user }) {
      const email = (user?.email ?? token.email ?? "").toLowerCase();
      const name = user?.name ?? (typeof token.name === "string" ? token.name : email);
      const shouldRefreshIdentity =
        Boolean(user?.email) ||
        !token.userId ||
        !token.role ||
        (allowedAdminEmails.includes(email) && token.role !== "ADMIN");

      if (email && shouldRefreshIdentity) {
        try {
          const res = await fetch(`${process.env.API_URL}/api/auth/verify-token`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email,
              name,
              avatar: user?.image ?? null,
            }),
          });

          if (res.ok) {
            const data = (await res.json()) as { id: string; role: string };
            token.role = data.role;
            token.userId = data.id;
          }
        } catch {
          // Keep existing token values when API is temporarily unreachable.
        }
      }

      if (!token.role && allowedAdminEmails.includes(email)) {
        token.role = "ADMIN";
      }
      token.role ??= "STUDENT";
      return token;
    },
    async session({ session, token }) {
      session.user.id = (token.userId as string) ?? "";
      session.user.role = (token.role as string) ?? "STUDENT";
      return session;
    },
  },
});
