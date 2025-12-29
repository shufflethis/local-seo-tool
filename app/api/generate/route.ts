import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json()

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt ist erforderlich' }, { status: 400 })
    }

    const apiKey = process.env.OPENAI_API_KEY

    if (!apiKey) {
      return NextResponse.json({
        error: 'API Key nicht konfiguriert. Bitte OPENAI_API_KEY in .env.local setzen.'
      }, { status: 500 })
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Du bist ein erfahrener Local SEO Experte. Du hilfst lokalen Unternehmen dabei, ihre Online-Sichtbarkeit zu verbessern. Antworte immer auf Deutsch und liefere praktische, umsetzbare Inhalte.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    })

    if (!response.ok) {
      const error = await response.json()
      return NextResponse.json({
        error: `OpenAI API Fehler: ${error.error?.message || 'Unbekannter Fehler'}`
      }, { status: response.status })
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      return NextResponse.json({ error: 'Keine Antwort von der API erhalten' }, { status: 500 })
    }

    return NextResponse.json({ content })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({
      error: 'Interner Serverfehler. Bitte versuche es erneut.'
    }, { status: 500 })
  }
}
