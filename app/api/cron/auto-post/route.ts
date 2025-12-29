import { NextRequest, NextResponse } from 'next/server'
import { db, schema } from '@/lib/db'
import { eq, and } from 'drizzle-orm'
import { createGBPPost } from '@/lib/gbp'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

const POST_TEMPLATES = [
  (biz: any) => `Schreibe einen kurzen, ansprechenden Google Business Post für ${biz.name} in ${biz.city}.
Thema: Saisonales Angebot oder aktuelle Dienstleistung.
Services: ${biz.services || 'Dienstleistungen'}
Max 300 Zeichen, mit Call-to-Action und 1-2 Emojis.`,

  (biz: any) => `Erstelle einen Google Business Post für ${biz.name} in ${biz.city}.
Thema: Kundenzufriedenheit und Qualität betonen.
Branche: ${biz.industry || 'Dienstleistung'}
Max 300 Zeichen, authentisch und lokal.`,

  (biz: any) => `Schreibe einen Google Business Post für ${biz.name} in ${biz.city}.
Thema: Lokale Expertise und Erfahrung.
Stadtteile: ${biz.neighborhoods || biz.city}
Max 300 Zeichen, mit Kontaktaufforderung.`,

  (biz: any) => `Erstelle einen Google Business Post für ${biz.name} in ${biz.city}.
Thema: Besonderer Service oder Alleinstellungsmerkmal.
Services: ${biz.services || 'verschiedene Dienstleistungen'}
Max 300 Zeichen, überzeugend und lokal.`
]

async function generateContent(prompt: string): Promise<string> {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'HTTP-Referer': process.env.NEXTAUTH_URL || 'https://local-seo-tool.vercel.app',
      'X-Title': 'Local SEO Generator'
    },
    body: JSON.stringify({
      model: 'deepseek/deepseek-chat',
      messages: [
        {
          role: 'system',
          content: 'Du bist ein Local SEO Experte. Schreibe kurze, prägnante Google Business Posts auf Deutsch.'
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.8,
      max_tokens: 500
    })
  })

  const data = await response.json()
  return data.choices?.[0]?.message?.content || ''
}

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Get all users with active subscription and auto-posting enabled
    const activeUsers = await db.query.users.findMany({
      where: and(
        eq(schema.users.subscriptionStatus, 'active'),
        eq(schema.users.autoPostingEnabled, true)
      )
    })

    const results = []

    for (const user of activeUsers) {
      if (!user.googleAccessToken) continue

      // Get user's businesses
      const businesses = await db.query.businesses.findMany({
        where: eq(schema.businesses.userId, user.id)
      })

      for (const business of businesses) {
        if (!business.gbpLocationId) continue

        try {
          // Pick a random template
          const template = POST_TEMPLATES[Math.floor(Math.random() * POST_TEMPLATES.length)]
          const prompt = template(business)

          // Generate content
          const content = await generateContent(prompt)

          if (!content) continue

          // Post to GBP
          await createGBPPost(user.googleAccessToken, business.gbpLocationId, content)

          // Log the post
          await db.insert(schema.scheduledPosts).values({
            id: crypto.randomUUID(),
            businessId: business.id,
            userId: user.id,
            content,
            postType: 'auto_gbp_post',
            status: 'posted',
            scheduledFor: new Date(),
            postedAt: new Date()
          })

          results.push({
            userId: user.id,
            businessId: business.id,
            status: 'posted'
          })
        } catch (error: any) {
          console.error(`Error posting for ${business.id}:`, error)
          results.push({
            userId: user.id,
            businessId: business.id,
            status: 'failed',
            error: error.message
          })
        }
      }
    }

    return NextResponse.json({
      processed: results.length,
      results
    })
  } catch (error) {
    console.error('Auto-post cron error:', error)
    return NextResponse.json({ error: 'Cron job failed' }, { status: 500 })
  }
}
