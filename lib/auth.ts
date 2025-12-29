import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { db, schema } from './db'
import { eq } from 'drizzle-orm'

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'openid email profile https://www.googleapis.com/auth/business.manage',
          access_type: 'offline',
          prompt: 'consent'
        }
      }
    })
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        try {
          const existingUser = await db.query.users.findFirst({
            where: eq(schema.users.email, user.email!)
          })

          if (!existingUser) {
            await db.insert(schema.users).values({
              id: crypto.randomUUID(),
              email: user.email!,
              name: user.name,
              image: user.image,
              googleAccessToken: account.access_token,
              googleRefreshToken: account.refresh_token
            })
          } else {
            await db.update(schema.users)
              .set({
                googleAccessToken: account.access_token,
                googleRefreshToken: account.refresh_token
              })
              .where(eq(schema.users.email, user.email!))
          }
        } catch (error) {
          console.error('Error saving user:', error)
        }
      }
      return true
    },
    async session({ session, token }) {
      if (session.user?.email) {
        const dbUser = await db.query.users.findFirst({
          where: eq(schema.users.email, session.user.email)
        })
        if (dbUser) {
          (session.user as any).id = dbUser.id
        }
      }
      return session
    },
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token
      }
      return token
    }
  },
  pages: {
    signIn: '/login'
  },
  session: {
    strategy: 'jwt'
  }
}
