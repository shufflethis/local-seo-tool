import { NextRequest, NextResponse } from 'next/server'
import { db, schema } from '@/lib/db'
import { eq, and, lte } from 'drizzle-orm'
import { createGBPPost } from '@/lib/gbp'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const now = new Date()

    // Get all pending posts that should be posted
    const pendingPosts = await db.query.scheduledPosts.findMany({
      where: and(
        eq(schema.scheduledPosts.status, 'pending'),
        lte(schema.scheduledPosts.scheduledFor, now)
      )
    })

    const results = []

    for (const post of pendingPosts) {
      try {
        // Get user for access token
        const user = await db.query.users.findFirst({
          where: eq(schema.users.id, post.userId)
        })

        if (!user?.googleAccessToken) {
          await db.update(schema.scheduledPosts)
            .set({ status: 'failed', error: 'Keine Google-Berechtigung' })
            .where(eq(schema.scheduledPosts.id, post.id))
          continue
        }

        // Get business for location
        const business = await db.query.businesses.findFirst({
          where: eq(schema.businesses.id, post.businessId)
        })

        if (!business?.gbpLocationId) {
          await db.update(schema.scheduledPosts)
            .set({ status: 'failed', error: 'Keine GBP Location verknüpft' })
            .where(eq(schema.scheduledPosts.id, post.id))
          continue
        }

        // Post to GBP
        await createGBPPost(user.googleAccessToken, business.gbpLocationId, post.content)

        // Mark as posted
        await db.update(schema.scheduledPosts)
          .set({ status: 'posted', postedAt: now })
          .where(eq(schema.scheduledPosts.id, post.id))

        results.push({ id: post.id, status: 'posted' })
      } catch (error: any) {
        await db.update(schema.scheduledPosts)
          .set({ status: 'failed', error: error.message })
          .where(eq(schema.scheduledPosts.id, post.id))

        results.push({ id: post.id, status: 'failed', error: error.message })
      }
    }

    return NextResponse.json({
      processed: results.length,
      results
    })
  } catch (error) {
    console.error('Cron error:', error)
    return NextResponse.json({ error: 'Cron job failed' }, { status: 500 })
  }
}
