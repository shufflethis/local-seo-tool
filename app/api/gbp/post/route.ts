import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db, schema } from '@/lib/db'
import { eq } from 'drizzle-orm'
import { createGBPPost } from '@/lib/gbp'

export async function POST(request: NextRequest) {
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

    const { locationName, content, callToAction, schedule } = await request.json()

    if (!locationName || !content) {
      return NextResponse.json({ error: 'Location und Content erforderlich' }, { status: 400 })
    }

    // If scheduled, save to database
    if (schedule) {
      const business = await db.query.businesses.findFirst({
        where: eq(schema.businesses.gbpLocationId, locationName)
      })

      if (business) {
        await db.insert(schema.scheduledPosts).values({
          id: crypto.randomUUID(),
          businessId: business.id,
          userId: user.id,
          content,
          postType: 'gbp_post',
          status: 'pending',
          scheduledFor: new Date(schedule)
        })

        return NextResponse.json({
          success: true,
          message: `Post geplant für ${new Date(schedule).toLocaleDateString('de-DE')}`
        })
      }
    }

    // Post immediately
    const result = await createGBPPost(user.googleAccessToken, locationName, content, callToAction)

    return NextResponse.json({
      success: true,
      post: result
    })
  } catch (error: any) {
    console.error('GBP post error:', error)
    return NextResponse.json({
      error: error.message || 'Fehler beim Erstellen des Posts'
    }, { status: 500 })
  }
}
