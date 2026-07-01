import NextAuth from "next-auth"
import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import { MongoDBAdapter } from "@auth/mongodb-adapter"
import bcrypt from "bcryptjs"
import getClientPromise from "@/lib/db/mongodbClient"

let _authOptions: NextAuthOptions | null = null;
let adapterCache: any = undefined;

async function getAdapter() {
  if (adapterCache !== undefined) return adapterCache;
  try {
    adapterCache = MongoDBAdapter(getClientPromise()) as any;
  } catch {
    adapterCache = undefined;
  }
  return adapterCache;
}

function buildAuthOptions(adapter: any): NextAuthOptions {
  return {
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
}

async function getAuthOptions(): Promise<NextAuthOptions> {
  if (_authOptions) return _authOptions;
  const adapter = await getAdapter();
  _authOptions = buildAuthOptions(adapter);
  return _authOptions;
}

const handler = NextAuth(await getAuthOptions())

export { handler as GET, handler as POST }