import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import * as bcrypt from "bcryptjs"
import { JWT } from "next-auth/jwt"

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        nip: { label: "NIP", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.nip || !credentials?.password) {
          throw new Error("Missing credentials")
        }

        const user = await prisma.employee.findUnique({
          where: {
            nip: credentials.nip,
          },
        })

        if (!user || !user.password) {
          throw new Error("Invalid credentials")
        }

        const isValid = await bcrypt.compare(credentials.password, user.password)

        if (!isValid) {
          throw new Error("Invalid credentials")
        }

        return {
          id: user.id,
          name: user.name,
          nip: user.nip,
          role: user.role,
        }
      }
    })
  ],
  session: {
    strategy: "jwt" as const
  },
  callbacks: {
    async jwt({ token, user }: { token: JWT; user: any }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.nip = user.nip
      }
      return token
    },
    async session({ session, token }: { session: any, token: any }) {
      if (token) {
        session.user.id = token.id
        session.user.role = token.role
        session.user.nip = token.nip
      }
      return session
    }
  },
  pages: {
    signIn: "/"
  }
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }