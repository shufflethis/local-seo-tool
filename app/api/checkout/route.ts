import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db, schema } from '@/lib/db'
import { eq } from 'drizzle-orm'
import { createCheckoutUrl } from '@/lib/lemonsqueezy'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })
    }

    const user = await db.query.users.findFirst({
      where: eq(schema.users.email, session.user.email)
    })

    if (!user) {
      return NextResponse.json({ error: 'User nicht gefunden' }, { status: 404 })
    }

    const checkoutUrl = await createCheckoutUrl(user.email, user.id)

    if (!checkoutUrl) {
      return NextResponse.json({ error: 'Checkout konnte nicht erstellt werden' }, { status: 500 })
    }

    return NextResponse.json({ url: checkoutUrl })
  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json({ error: 'Fehler beim Erstellen des Checkouts' }, { status: 500 })
  }
}
