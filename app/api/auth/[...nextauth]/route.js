import NextAuth from "next-auth";
import GithubProvider from "next-auth/providers/github";
// import EmailProvider from "next-auth/providers/email";
import User from "@/models/user";
import ConnectDb from "@/db/connectDb";

export const authOptions = {
  providers: [
    GithubProvider({
        clientId: process.env.GITHUB_ID,
        clientSecret: process.env.GITHUB_SECRET,
    }),
  ],
   callbacks: {
    async signIn({ user, account }) {
      try {
        if (!user?.email) return false;

        if (account?.provider === "github") {
          await ConnectDb();
          const curruser = await User.findOne({ email: user.email });

          if (!curruser) {
            await User.create({
              name: user.name || user.email.split("@")[0],
              email: user.email,
              username: user.email.split("@")[0],
              profilepic: user.image || "",
            });
          }
        }

        return true;
      } catch (error) {
        console.error("[auth.signIn]", error);
        return false;
      }
    },
    async session({ session }) {
      try {
        if (!session?.user?.email) return session;

        await ConnectDb();
        const dbUser = await User.findOne({ email: session.user.email });

        if (dbUser?.username) {
          session.user.name = dbUser.username;
          session.user.username = dbUser.username;
          // Backward-compatible top-level field used elsewhere in this codebase.
          session.username = dbUser.username;
        }

        return session;
      } catch (error) {
        console.error("[auth.session]", error);
        return session;
      }
   },
  }
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };