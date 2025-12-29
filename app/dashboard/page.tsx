'use client'

import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'

interface Business {
  id: string
  name: string
  website?: string
  city?: string
  gbpLocationId?: string
}

interface User {
  subscriptionStatus?: string
  autoPostingEnabled?: boolean
  onboardingCompleted?: boolean
}

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [scanning, setScanning] = useState(false)
  const [step, setStep] = useState(1)

  const success = searchParams.get('success')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated') {
      fetchData()
    }
  }, [status])

  useEffect(() => {
    if (success === 'true') {
      // Payment successful, refresh data
      fetchData()
    }
  }, [success])

  const fetchData = async () => {
    try {
      const [bizRes, userRes] = await Promise.all([
        fetch('/api/businesses'),
        fetch('/api/user')
      ])

      if (bizRes.ok) {
        const bizData = await bizRes.json()
        setBusinesses(bizData)
        if (bizData.length > 0) setStep(2)
      }

      if (userRes.ok) {
        const userData = await userRes.json()
        setUser(userData)
        if (userData.subscriptionStatus === 'active') setStep(3)
      }
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
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

      if (data.success) {
        // Save business
        await fetch('/api/businesses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...data.data,
            website: websiteUrl
          })
        })

        fetchData()
        setStep(2)
      }
    } catch (e) {
      console.error(e)
    }
    setScanning(false)
  }

  const startCheckout = async () => {
    try {
      const res = await fetch('/api/checkout', { method: 'POST' })
      const data = await res.json()

      if (data.url) {
        window.location.href = data.url
      }
    } catch (e) {
      console.error(e)
    }
  }

  if (loading || status === 'loading') {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400">Laden...</div>
      </main>
    )
  }

  const isSubscribed = user?.subscriptionStatus === 'active'

  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-lg">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">
            <span className="gradient-text">Local SEO</span> Dashboard
          </h1>
          <div className="flex items-center gap-3">
            {isSubscribed && (
              <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">
                Pro Aktiv
              </span>
            )}
            <img
              src={session?.user?.image || ''}
              alt=""
              className="w-8 h-8 rounded-full"
            />
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {success === 'true' && (
          <div className="bg-green-500/20 border border-green-500/50 rounded-xl p-4 mb-8">
            <p className="text-green-400 font-medium">Zahlung erfolgreich! Dein Auto-Posting ist jetzt aktiv.</p>
          </div>
        )}

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-4 mb-12">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                step >= s ? 'bg-purple-600' : 'bg-gray-800'
              }`}>
                {step > s ? '✓' : s}
              </div>
              {s < 3 && (
                <div className={`w-16 h-1 ${step > s ? 'bg-purple-600' : 'bg-gray-800'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Add Website */}
        <div className={`bg-gray-900 rounded-2xl p-6 mb-6 ${step !== 1 && businesses.length === 0 ? 'opacity-50' : ''}`}>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">🌐</span>
            <div>
              <h2 className="font-bold">Schritt 1: Website hinzufügen</h2>
              <p className="text-gray-400 text-sm">Wir scannen deine Website automatisch</p>
            </div>
            {businesses.length > 0 && <span className="ml-auto text-green-400">✓</span>}
          </div>

          {businesses.length === 0 ? (
            <div className="flex gap-4">
              <input
                type="text"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://deine-website.de"
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3"
              />
              <button
                onClick={scanWebsite}
                disabled={scanning || !websiteUrl}
                className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 px-6 py-3 rounded-lg font-medium"
              >
                {scanning ? 'Scanne...' : 'Scannen'}
              </button>
            </div>
          ) : (
            <div className="bg-gray-800 rounded-lg p-4">
              {businesses.map((biz) => (
                <div key={biz.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{biz.name}</p>
                    <p className="text-sm text-gray-400">{biz.city} - {biz.website}</p>
                  </div>
                  {biz.gbpLocationId ? (
                    <span className="text-green-400 text-sm">GBP verbunden</span>
                  ) : (
                    <span className="text-yellow-400 text-sm">GBP ausstehend</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Step 2: Connect GBP */}
        <div className={`bg-gray-900 rounded-2xl p-6 mb-6 ${step < 2 ? 'opacity-50' : ''}`}>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">📱</span>
            <div>
              <h2 className="font-bold">Schritt 2: Google Business verbinden</h2>
              <p className="text-gray-400 text-sm">Damit wir automatisch posten können</p>
            </div>
            {businesses.some(b => b.gbpLocationId) && <span className="ml-auto text-green-400">✓</span>}
          </div>

          {step >= 2 && !businesses.some(b => b.gbpLocationId) && (
            <button
              onClick={() => router.push('/connect-gbp')}
              className="w-full bg-gray-800 hover:bg-gray-700 py-3 rounded-lg font-medium"
            >
              Google Business Profile verbinden
            </button>
          )}

          {businesses.some(b => b.gbpLocationId) && (
            <p className="text-green-400 text-sm">Google Business Profile ist verbunden!</p>
          )}
        </div>

        {/* Step 3: Subscribe */}
        <div className={`bg-gray-900 rounded-2xl p-6 mb-6 ${step < 2 ? 'opacity-50' : ''}`}>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">🚀</span>
            <div>
              <h2 className="font-bold">Schritt 3: Auto-Posting aktivieren</h2>
              <p className="text-gray-400 text-sm">Wöchentlich automatische GBP Posts</p>
            </div>
            {isSubscribed && <span className="ml-auto text-green-400">✓</span>}
          </div>

          {!isSubscribed ? (
            <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold">Pro Plan</h3>
                  <p className="text-gray-400">Alles automatisch</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold">5€</p>
                  <p className="text-gray-400 text-sm">/Monat</p>
                </div>
              </div>

              <ul className="space-y-2 mb-6">
                <li className="flex items-center gap-2 text-sm">
                  <span className="text-green-400">✓</span>
                  Wöchentliche automatische GBP Posts
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <span className="text-green-400">✓</span>
                  KI-generierter, lokaler Content
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <span className="text-green-400">✓</span>
                  Unbegrenzte manuelle Generierungen
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <span className="text-green-400">✓</span>
                  Jederzeit kündbar
                </li>
              </ul>

              <button
                onClick={startCheckout}
                disabled={step < 2}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 py-3 rounded-xl font-bold text-lg"
              >
                Jetzt starten
              </button>
            </div>
          ) : (
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6">
              <p className="text-green-400 font-medium mb-2">Auto-Posting ist aktiv!</p>
              <p className="text-gray-400 text-sm">
                Jeden Montag um 10:00 Uhr wird automatisch ein neuer Post generiert und veröffentlicht.
              </p>

              <div className="mt-4 flex gap-4">
                <button
                  onClick={() => router.push('/')}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 py-2 rounded-lg text-sm"
                >
                  Manuell generieren
                </button>
                <button
                  className="flex-1 bg-gray-800 hover:bg-gray-700 py-2 rounded-lg text-sm"
                >
                  Einstellungen
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Stats if subscribed */}
        {isSubscribed && (
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-900 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-purple-400">4</p>
              <p className="text-gray-400 text-sm">Posts diesen Monat</p>
            </div>
            <div className="bg-gray-900 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-green-400">12</p>
              <p className="text-gray-400 text-sm">Posts gesamt</p>
            </div>
            <div className="bg-gray-900 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-pink-400">89%</p>
              <p className="text-gray-400 text-sm">Engagement</p>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
