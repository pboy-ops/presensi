import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "./prisma"
import * as bcrypt from "bcryptjs"
import "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    user: {
      pangkat: any
      id: string
      role: string
      nip: string
      name?: string | null
      email?: string | null
      image?: string | null
    }
  }
  interface User {
    id: string
    role: string
    nip: string
    name?: string | null
    pangkat?: string | null
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
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

        const employee = await prisma.employee.findUnique({
          where: {
            nip: credentials.nip,
          },
        })

        if (!employee) {
          throw new Error("Invalid credentials")
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          employee.password!
        )

        if (!isPasswordValid) {
          throw new Error("Invalid credentials")
        }

        return {
          id: employee.id,
          name: employee.name,
          nip: employee.nip,
          role: employee.role,
          pangkat: employee.pangkat,
        }
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (token) {
        session.user = session.user || {}
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.nip = token.nip as string
        session.user.pangkat = token.pangkat as string
      }
      return session
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.nip = user.nip
        token.pangkat = user.pangkat
      }
      return token
    },
  },
  pages: {
    signIn: "/",
    error: "/",
  },
}
