'use client'

import { useState, useEffect } from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'

const tools = [
  {
    id: 'service-page',
    title: '1. Service Page Generator',
    description: 'Erstelle standortoptimierte Service-Seiten mit lokalen Keywords',
    icon: '📍',
    fields: ['service', 'city', 'neighborhoods'],
    prompt: (data: any) => `Erstelle eine SEO-optimierte Service-Seite für "${data.service} in ${data.city}".

Inkludiere:
- H1 mit Hauptkeyword
- Lokale Stadtteile und Nachbarschaften: ${data.neighborhoods || 'bekannte Viertel der Stadt'}
- Lokale Landmarks und Sehenswürdigkeiten
- Typische Kundenprobleme in der Region
- Call-to-Action mit lokaler Telefonnummer
- Schema.org LocalBusiness Markup Vorschlag

Schreibe auf Deutsch, SEO-optimiert mit natürlicher Keyword-Dichte.`
  },
  {
    id: 'gbp-post',
    title: '2. Google Business Profil Posts',
    description: 'Wöchentliche GBP Posts für mehr Sichtbarkeit',
    icon: '📱',
    fields: ['business', 'city', 'offer'],
    canPostToGBP: true,
    prompt: (data: any) => `Schreibe einen Google Business Profil Post für ${data.business} in ${data.city}.

Angebot/Thema: ${data.offer || 'Saisonales Angebot'}

Anforderungen:
- Max 1500 Zeichen
- Aufmerksamkeitsstarker Einstieg
- Lokaler Bezug zur Stadt
- Klarer Call-to-Action
- 2-3 passende Emojis
- Lokale Schlüsselwörter einbauen

Erstelle 3 verschiedene Varianten.`
  },
  {
    id: 'review-response',
    title: '3. Review Antwort-Vorlagen',
    description: 'Keyword-reiche Antworten auf Google Bewertungen',
    icon: '⭐',
    fields: ['business', 'city', 'services'],
    prompt: (data: any) => `Erstelle Antwort-Vorlagen für Google Bewertungen für ${data.business} in ${data.city}.

Hauptservices: ${data.services || 'verschiedene Dienstleistungen'}

Erstelle:
1. 3 Antworten für 5-Sterne Bewertungen
2. 2 Antworten für 4-Sterne Bewertungen
3. 2 Antworten für 3-Sterne Bewertungen
4. 1 professionelle Antwort für negative Bewertungen

Jede Antwort sollte:
- Persönlich und authentisch klingen
- Den Service/die Stadt natürlich erwähnen
- Zur erneuten Kontaktaufnahme einladen
- Maximal 3-4 Sätze lang sein`
  },
  {
    id: 'faq',
    title: '4. Lokale FAQ Sektion',
    description: 'FAQs für Long-Tail und Voice-Search',
    icon: '❓',
    fields: ['business', 'city', 'service'],
    prompt: (data: any) => `Generiere 10 lokale FAQ-Fragen und Antworten für ${data.business} (${data.service}) in ${data.city}.

Die Fragen sollten:
- Typische Kundenanfragen abdecken
- Long-Tail Keywords enthalten
- Voice-Search-optimiert sein (natürliche Sprache)
- Lokale Relevanz haben

Format:
Q: [Frage]
A: [Antwort mit 2-3 Sätzen]

Inkludiere Fragen wie:
- Reaktionszeiten in der Stadt
- Preise/Kosten in der Region
- Servicegebiet und Stadtteile
- Lokale Besonderheiten`
  },
  {
    id: 'citations',
    title: '5. NAP Citation Checker',
    description: 'Konsistente Name-Adresse-Telefon Angaben',
    icon: '📋',
    fields: ['name', 'address', 'phone', 'citations'],
    prompt: (data: any) => `Analysiere und normalisiere diese NAP (Name, Address, Phone) Daten:

Geschäftsname: ${data.name}
Adresse: ${data.address}
Telefon: ${data.phone}

Vorhandene Citations/Einträge:
${data.citations || 'Keine angegeben'}

Aufgaben:
1. Erstelle das EINHEITLICHE NAP Format
2. Zeige typische Fehler auf (Abkürzungen, Formatierung)
3. Liste die wichtigsten Verzeichnisse für lokale Einträge auf
4. Gib Tipps für konsistente Citations`
  },
  {
    id: 'content-ideas',
    title: '6. Lokale Content-Ideen',
    description: 'Blog-Themen mit lokalem Bezug',
    icon: '💡',
    fields: ['business', 'city', 'industry'],
    prompt: (data: any) => `Generiere 15 Blog-Themen für ${data.business} in ${data.city} (Branche: ${data.industry || 'Dienstleistung'}).

Die Themen sollten:
- Lokale Events und Besonderheiten aufgreifen
- Saisonale Relevanz haben
- E-E-A-T Signale stärken (Expertise, Experience, Authority, Trust)
- Lokale Suchintention bedienen

Format für jedes Thema:
- Titel (mit Keyword)
- Ziel-Keyword
- Kurzbeschreibung (1 Satz)
- Suchintention (informational/transactional)`
  },
  {
    id: 'about-page',
    title: '7. About & Contact Optimierung',
    description: 'Lokale Signale für Über-uns Seiten',
    icon: '🏠',
    fields: ['business', 'city', 'story', 'landmarks'],
    prompt: (data: any) => `Optimiere die "Über uns" Seite für ${data.business} in ${data.city}.

Unternehmensgeschichte: ${data.story || 'Familienunternehmen mit lokaler Verwurzelung'}
Bekannte Landmarks in der Nähe: ${data.landmarks || 'Zentrale Lage'}

Erstelle:
1. Optimierte "Über uns" Sektion (300-400 Wörter)
   - Lokale Verwurzelung betonen
   - Stadtteile/Nachbarschaften erwähnen
   - Persönliche Geschichte einbauen
   - Lokale Landmarks als Orientierung

2. Optimierte "Kontakt" Sektion
   - NAP prominent platziert
   - Wegbeschreibung mit lokalen Bezügen
   - Servicegebiet definieren
   - Öffnungszeiten Format

3. Schema.org Markup Vorschlag für LocalBusiness`
  },
]

interface Business {
  id: string
  name: string
  website?: string
  address?: string
  phone?: string
  city?: string
  neighborhoods?: string
  services?: string
  industry?: string
  gbpLocationId?: string
}

export default function Home() {
  const { data: session, status } = useSession()
  const [activeTool, setActiveTool] = useState(tools[0].id)
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [copied, setCopied] = useState(false)
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null)
  const [showBusinessModal, setShowBusinessModal] = useState(false)

  const currentTool = tools.find(t => t.id === activeTool)!

  useEffect(() => {
    if (session) {
      fetchBusinesses()
    }
  }, [session])

  const fetchBusinesses = async () => {
    try {
      const res = await fetch('/api/businesses')
      if (res.ok) {
        const data = await res.json()
        setBusinesses(data)
        if (data.length > 0 && !selectedBusiness) {
          setSelectedBusiness(data[0])
          applyBusinessData(data[0])
        }
      }
    } catch (e) {
      console.error('Error fetching businesses:', e)
    }
  }

  const applyBusinessData = (business: Business) => {
    setFormData({
      business: business.name || '',
      name: business.name || '',
      city: business.city || '',
      address: business.address || '',
      phone: business.phone || '',
      neighborhoods: business.neighborhoods || '',
      services: business.services || '',
      service: business.services?.split(',')[0]?.trim() || '',
      industry: business.industry || ''
    })
  }

  const scanWebsite = async () => {
    if (!websiteUrl) return

    setScanning(true)
    try {
      const res = await fetch('/api/scan-website', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: websiteUrl })
      })

      const data = await res.json()

      if (data.success && data.data) {
        setFormData(prev => ({
          ...prev,
          ...data.data,
          business: data.data.name || prev.business,
          service: data.data.services?.split(',')[0]?.trim() || prev.service
        }))

        // Save as business if logged in
        if (session) {
          const bizRes = await fetch('/api/businesses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...data.data,
              website: websiteUrl
            })
          })

          if (bizRes.ok) {
            fetchBusinesses()
          }
        }
      }
    } catch (error) {
      console.error('Scan error:', error)
    }
    setScanning(false)
  }

  const handleGenerate = async () => {
    setLoading(true)
    setResult('')

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: currentTool.prompt(formData)
        })
      })

      const data = await response.json()
      setResult(data.content || data.error || 'Fehler beim Generieren')
    } catch (error) {
      setResult('Fehler: API nicht erreichbar. Bitte API Key konfigurieren.')
    }

    setLoading(false)
  }

  const postToGBP = async () => {
    if (!session || !selectedBusiness?.gbpLocationId || !result) return

    try {
      const res = await fetch('/api/gbp/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locationName: selectedBusiness.gbpLocationId,
          content: result.split('\n\n')[0] // First variant
        })
      })

      const data = await res.json()
      if (data.success) {
        alert('Post erfolgreich zu GBP gesendet!')
      } else {
        alert('Fehler: ' + data.error)
      }
    } catch (error) {
      alert('Fehler beim Posten')
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(result)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const getFieldLabel = (field: string) => {
    const labels: Record<string, string> = {
      service: 'Service/Dienstleistung',
      city: 'Stadt',
      neighborhoods: 'Stadtteile (optional)',
      business: 'Geschäftsname',
      offer: 'Angebot/Aktion',
      services: 'Hauptservices',
      industry: 'Branche',
      name: 'Firmenname',
      address: 'Adresse',
      phone: 'Telefon',
      citations: 'Bestehende Einträge (optional)',
      story: 'Unternehmensgeschichte (optional)',
      landmarks: 'Landmarks in der Nähe (optional)',
    }
    return labels[field] || field
  }

  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              <span className="gradient-text">Local SEO</span> Generator
            </h1>
            <p className="text-gray-400 text-sm">7 KI-Tools für lokale Unternehmen</p>
          </div>

          <div className="flex items-center gap-4">
            {status === 'loading' ? (
              <div className="text-gray-400">...</div>
            ) : session ? (
              <div className="flex items-center gap-3">
                {businesses.length > 0 && (
                  <select
                    value={selectedBusiness?.id || ''}
                    onChange={(e) => {
                      const biz = businesses.find(b => b.id === e.target.value)
                      if (biz) {
                        setSelectedBusiness(biz)
                        applyBusinessData(biz)
                      }
                    }}
                    className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
                  >
                    {businesses.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                )}
                <img
                  src={session.user?.image || ''}
                  alt=""
                  className="w-8 h-8 rounded-full"
                />
                <button
                  onClick={() => signOut()}
                  className="text-sm text-gray-400 hover:text-white"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button
                onClick={() => signIn('google')}
                className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg text-sm font-medium transition"
              >
                Mit Google anmelden
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Website Scanner */}
        <div className="bg-gray-900 rounded-2xl p-6 mb-8">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            🔍 Website Auto-Scan
            <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded-full">NEU</span>
          </h2>
          <div className="flex gap-4">
            <input
              type="text"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="https://deine-website.de"
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              onClick={scanWebsite}
              disabled={scanning || !websiteUrl}
              className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 disabled:cursor-not-allowed px-6 py-3 rounded-lg font-medium transition flex items-center gap-2"
            >
              {scanning ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Scanne...
                </>
              ) : (
                'Website scannen'
              )}
            </button>
          </div>
          <p className="text-gray-500 text-sm mt-2">
            Extrahiert automatisch: Firmenname, Adresse, Telefon, Services, Stadt
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Tool Selection */}
          <div className="lg:col-span-1">
            <nav className="space-y-2 sticky top-24">
              {tools.map(tool => (
                <button
                  key={tool.id}
                  onClick={() => {
                    setActiveTool(tool.id)
                    setResult('')
                  }}
                  className={`w-full text-left p-3 rounded-xl transition ${
                    activeTool === tool.id
                      ? 'bg-purple-500/20 border border-purple-500/50 text-purple-300'
                      : 'bg-gray-900 hover:bg-gray-800 text-gray-300'
                  }`}
                >
                  <span className="text-xl mr-2">{tool.icon}</span>
                  <span className="text-sm font-medium">{tool.title}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Tool Header */}
            <div className="bg-gray-900 rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <span className="text-4xl">{currentTool.icon}</span>
                <div>
                  <h2 className="text-xl font-bold">{currentTool.title}</h2>
                  <p className="text-gray-400">{currentTool.description}</p>
                </div>
              </div>
            </div>

            {/* Input Form */}
            <div className="bg-gray-900 rounded-2xl p-6">
              <h3 className="font-semibold mb-4">Eingaben</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentTool.fields.map(field => (
                  <div key={field} className={field.includes('optional') || field === 'citations' || field === 'story' ? 'md:col-span-2' : ''}>
                    <label className="block text-sm text-gray-400 mb-1">
                      {getFieldLabel(field)}
                    </label>
                    {field === 'citations' || field === 'story' ? (
                      <textarea
                        value={formData[field] || ''}
                        onChange={e => setFormData({...formData, [field]: e.target.value})}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 h-24"
                        placeholder={`${getFieldLabel(field)}...`}
                      />
                    ) : (
                      <input
                        type="text"
                        value={formData[field] || ''}
                        onChange={e => setFormData({...formData, [field]: e.target.value})}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder={`${getFieldLabel(field)}...`}
                      />
                    )}
                  </div>
                ))}
              </div>

              <button
                onClick={handleGenerate}
                disabled={loading}
                className="mt-6 w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Generiere...
                  </>
                ) : (
                  <>✨ Content generieren</>
                )}
              </button>
            </div>

            {/* Result */}
            {result && (
              <div className="bg-gray-900 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Ergebnis</h3>
                  <div className="flex gap-2">
                    {(currentTool as any).canPostToGBP && session && selectedBusiness?.gbpLocationId && (
                      <button
                        onClick={postToGBP}
                        className="text-sm bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition flex items-center gap-2"
                      >
                        📱 Zu GBP posten
                      </button>
                    )}
                    <button
                      onClick={copyToClipboard}
                      className="text-sm bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg transition"
                    >
                      {copied ? '✓ Kopiert!' : '📋 Kopieren'}
                    </button>
                  </div>
                </div>
                <div className="bg-gray-800 rounded-xl p-4 whitespace-pre-wrap text-gray-200 max-h-[600px] overflow-y-auto">
                  {result}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-800 mt-16 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-500 text-sm">
          Local SEO Generator - Powered by DeepSeek AI
        </div>
      </footer>
    </main>
  )
}
