import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db, schema } from '@/lib/db'
import { eq } from 'drizzle-orm'
import { getGBPAccounts } from '@/lib/gbp'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })
    }

    const user = await db.query.users.findFirst({
      where: eq(schema.users.email, session.user.email)
    })

    if (!user?.googleAccessToken) {
      return NextResponse.json({ error: 'Keine Google-Berechtigung' }, { status: 401 })
    }

    const accounts = await getGBPAccounts(user.googleAccessToken)

    return NextResponse.json(accounts)
  } catch (error) {
    console.error('GBP accounts error:', error)
    return NextResponse.json({
      error: 'Fehler beim Abrufen der GBP-Konten'
    }, { status: 500 })
  }
}
