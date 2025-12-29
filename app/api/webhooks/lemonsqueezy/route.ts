import { NextRequest, NextResponse } from 'next/server'
import { db, schema } from '@/lib/db'
import { eq } from 'drizzle-orm'
import { verifyWebhookSignature } from '@/lib/lemonsqueezy'

export async function POST(request: NextRequest) {
  try {
    const payload = await request.text()
    const signature = request.headers.get('x-signature') || ''

    // Verify webhook signature
    const isValid = await verifyWebhookSignature(payload, signature)
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const data = JSON.parse(payload)
    const eventName = data.meta?.event_name
    const userId = data.meta?.custom_data?.user_id

    if (!userId) {
      return NextResponse.json({ error: 'No user ID' }, { status: 400 })
    }

    switch (eventName) {
      case 'subscription_created':
      case 'subscription_updated':
        await db.update(schema.users)
          .set({
            subscriptionId: data.data?.id,
            subscriptionStatus: data.data?.attributes?.status,
            subscriptionEndsAt: data.data?.attributes?.ends_at
              ? new Date(data.data.attributes.ends_at)
              : null
          })
          .where(eq(schema.users.id, userId))
        break

      case 'subscription_cancelled':
        await db.update(schema.users)
          .set({
            subscriptionStatus: 'cancelled',
            subscriptionEndsAt: data.data?.attributes?.ends_at
              ? new Date(data.data.attributes.ends_at)
              : new Date()
          })
          .where(eq(schema.users.id, userId))
        break

      case 'subscription_expired':
        await db.update(schema.users)
          .set({
            subscriptionStatus: 'expired'
          })
          .where(eq(schema.users.id, userId))
        break
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Webhook failed' }, { status: 500 })
  }
}
