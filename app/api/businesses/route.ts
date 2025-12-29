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

    const businesses = await db.query.businesses.findMany({
      where: eq(schema.businesses.userId, user.id)
    })

    return NextResponse.json(businesses)
  } catch (error) {
    console.error('Businesses error:', error)
    return NextResponse.json({ error: 'Fehler beim Abrufen' }, { status: 500 })
  }
}

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

    const data = await request.json()

    const business = await db.insert(schema.businesses).values({
      id: crypto.randomUUID(),
      userId: user.id,
      name: data.name,
      website: data.website,
      address: data.address,
      phone: data.phone,
      city: data.city,
      neighborhoods: data.neighborhoods,
      services: data.services,
      industry: data.industry,
      gbpAccountId: data.gbpAccountId,
      gbpLocationId: data.gbpLocationId
    }).returning()

    return NextResponse.json(business[0])
  } catch (error) {
    console.error('Create business error:', error)
    return NextResponse.json({ error: 'Fehler beim Speichern' }, { status: 500 })
  }
}
