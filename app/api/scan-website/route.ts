import { NextRequest, NextResponse } from 'next/server'
import * as cheerio from 'cheerio'

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json({ error: 'URL ist erforderlich' }, { status: 400 })
    }

    // Normalize URL
    let normalizedUrl = url
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      normalizedUrl = 'https://' + url
    }

    const response = await fetch(normalizedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LocalSEOBot/1.0)'
      }
    })

    if (!response.ok) {
      return NextResponse.json({ error: 'Website nicht erreichbar' }, { status: 400 })
    }

    const html = await response.text()
    const $ = cheerio.load(html)

    // Extract business information
    const data: Record<string, string> = {}

    // Business name - try various sources
    data.name = $('meta[property="og:site_name"]').attr('content') ||
                $('meta[name="application-name"]').attr('content') ||
                $('title').text().split('|')[0].split('-')[0].trim() ||
                ''

    // Phone numbers
    const phoneRegex = /(\+49|0)[0-9\s\-\/]{8,}/g
    const bodyText = $('body').text()
    const phones = bodyText.match(phoneRegex)
    if (phones && phones.length > 0) {
      data.phone = phones[0].replace(/\s+/g, ' ').trim()
    }

    // Address - look for common patterns
    const addressPatterns = [
      /\d{5}\s+[A-Za-zäöüÄÖÜß\s]+/, // PLZ + Stadt
      /[A-Za-zäöüÄÖÜß]+(?:straße|str\.|weg|platz|allee)\s*\d+/i
    ]

    for (const pattern of addressPatterns) {
      const match = bodyText.match(pattern)
      if (match) {
        data.address = (data.address ? data.address + ', ' : '') + match[0].trim()
      }
    }

    // City from address or meta
    const cityMatch = bodyText.match(/\d{5}\s+([A-Za-zäöüÄÖÜß\s]+)/)
    if (cityMatch) {
      data.city = cityMatch[1].trim().split(/\s+/)[0]
    }

    // Services - look for h2, h3 headings and list items
    const services: string[] = []
    $('h2, h3').each((_, el) => {
      const text = $(el).text().trim()
      if (text.length > 3 && text.length < 100 && !text.includes('Kontakt') && !text.includes('Impressum')) {
        services.push(text)
      }
    })
    if (services.length > 0) {
      data.services = services.slice(0, 5).join(', ')
    }

    // Industry from meta keywords or description
    const keywords = $('meta[name="keywords"]').attr('content')
    const description = $('meta[name="description"]').attr('content') ||
                       $('meta[property="og:description"]').attr('content')

    if (keywords) {
      data.industry = keywords.split(',')[0].trim()
    } else if (description) {
      data.industry = description.substring(0, 50)
    }

    // Look for schema.org LocalBusiness data
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const json = JSON.parse($(el).html() || '{}')
        if (json['@type']?.includes('LocalBusiness') || json['@type']?.includes('Organization')) {
          data.name = json.name || data.name
          data.phone = json.telephone || data.phone
          data.address = json.address?.streetAddress || data.address
          data.city = json.address?.addressLocality || data.city
        }
      } catch (e) {
        // Ignore JSON parse errors
      }
    })

    // Extract neighborhoods from content
    const neighborhoodKeywords = ['Stadtteil', 'Bezirk', 'Viertel', 'Umgebung']
    let neighborhoods = ''
    neighborhoodKeywords.forEach(keyword => {
      const regex = new RegExp(keyword + '[:\\s]+([^.]+)', 'i')
      const match = bodyText.match(regex)
      if (match) {
        neighborhoods += match[1].trim() + ', '
      }
    })
    if (neighborhoods) {
      data.neighborhoods = neighborhoods.replace(/, $/, '')
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Website erfolgreich gescannt'
    })

  } catch (error) {
    console.error('Scan error:', error)
    return NextResponse.json({
      error: 'Fehler beim Scannen der Website'
    }, { status: 500 })
  }
}
