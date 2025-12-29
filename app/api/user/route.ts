import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db, schema } from '@/lib/db'
import { eq } from 'drizzle-orm'

export async function GET(request: NextRequest) {
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

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      subscriptionStatus: user.subscriptionStatus,
      subscriptionEndsAt: user.subscriptionEndsAt,
      autoPostingEnabled: user.autoPostingEnabled,
      onboardingCompleted: user.onboardingCompleted,
      hasGBPAccess: !!user.googleAccessToken
    })
  } catch (error) {
    console.error('User API error:', error)
    return NextResponse.json({ error: 'Fehler' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })
    }

    const data = await request.json()

    await db.update(schema.users)
      .set({
        autoPostingEnabled: data.autoPostingEnabled,
        postFrequency: data.postFrequency,
        onboardingCompleted: data.onboardingCompleted
      })
      .where(eq(schema.users.email, session.user.email))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('User update error:', error)
    return NextResponse.json({ error: 'Fehler' }, { status: 500 })
  }
}
