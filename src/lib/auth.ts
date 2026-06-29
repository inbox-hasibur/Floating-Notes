import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import { MongoDBAdapter } from "@auth/mongodb-adapter"
import bcrypt from "bcryptjs"

let _authOptions: NextAuthOptions | null = null;

export async function getAuthOptions(): Promise<NextAuthOptions> {
  if (_authOptions) return _authOptions;

  let adapter: any = undefined;
  
  try {
    const mod = await import("@/lib/db/mongodbClient");
    const getClientPromise = mod.default;
    adapter = MongoDBAdapter(getClientPromise()) as any;
  } catch {
    // MongoDB not configured - will fail at runtime
  }

  _authOptions = {
    adapter,
    providers: [
      GoogleProvider({
        clientId: process.env.GOOGLE_ID as string,
        clientSecret: process.env.GOOGLE_SECRET as string,
      }),
      CredentialsProvider({
        name: "Email",
        credentials: {
          email: { label: "Email", type: "email" },
          password: { label: "Password", type: "password" }
        },
        async authorize(credentials) {
          if (!credentials?.email || !credentials?.password) return null;
          try {
            const mod = await import("@/lib/db/mongodbClient");
            const getClientPromise = mod.default;
            const db = (await getClientPromise()).db();
            const user = await db.collection("users").findOne({ email: credentials.email });
            if (!user) return null;
            const isValid = await bcrypt.compare(credentials.password, user.password);
            if (!isValid) return null;
            return { id: String(user._id), email: user.email, name: user.name };
          } catch {
            return null;
          }
        }
      }),
    ],
    session: {
      strategy: "jwt",
    },
    callbacks: {
      async session({ session, token }) {
        if (session.user && token.sub) {
          session.user.id = token.sub;
        }
        return session;
      },
    },
  };

  return _authOptions;
}