'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getUserId, getUserName, setUserName } from '@/lib/utils'
import { toast } from 'sonner'
import { Toaster } from 'sonner'

export default function HomePage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [mode, setMode] = useState<'choose' | 'create' | 'join'>('choose')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const saved = getUserName()
    if (saved) setName(saved)
  }, [])

  const handleCreate = async () => {
    if (!name.trim()) return toast.error('Zadej své jméno')
    setLoading(true)
    setUserName(name.trim())

    try {
      const res = await fetch('/api/rooms/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hostName: name.trim(), userId: getUserId() }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      router.push(`/room/${data.room.id}`)
    } catch (e: any) {
      toast.error(e.message || 'Chyba při vytváření místnosti')
    }
    setLoading(false)
  }

  const handleJoin = async () => {
    if (!name.trim()) return toast.error('Zadej své jméno')
    if (!code.trim() || code.length !== 6) return toast.error('Zadej 6místný kód')
    setLoading(true)
    setUserName(name.trim())

    try {
      const res = await fetch('/api/rooms/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code.toUpperCase(),
          playerName: name.trim(),
          userId: getUserId(),
        }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      router.push(`/room/${data.room.id}`)
    } catch (e: any) {
      toast.error(e.message || 'Chyba při připojování')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <Toaster theme="dark" position="top-center" />

      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="text-6xl mb-4">🎓</div>
          <h1 className="text-4xl font-black text-white tracking-tight">
            Karty Proti<br/>Maturitě
          </h1>
          <p className="text-zinc-500 mt-2 text-sm">18+ · ultra drsná česká verze · 2026</p>
        </div>

        <div className="mb-6">
          <label className="block text-xs text-zinc-400 uppercase tracking-widest mb-2">
            Tvoje jméno
          </label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Jak tě máme oslovovat?"
            className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-400 text-lg"
          />
        </div>

        {mode === 'choose' && (
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setMode('create')}
              className="py-4 bg-white text-black rounded-xl font-black text-lg hover:bg-zinc-100 transition-colors"
            >
              ➕ Vytvořit
            </button>
            <button
              onClick={() => setMode('join')}
              className="py-4 bg-zinc-800 text-white rounded-xl font-black text-lg hover:bg-zinc-700 transition-colors border border-zinc-600"
            >
              🔗 Připojit
            </button>
          </div>
        )}

        {mode === 'create' && (
          <div className="space-y-3">
            <button
              onClick={handleCreate}
              disabled={loading}
              className="w-full py-4 bg-white text-black rounded-xl font-black text-lg hover:bg-zinc-100 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Vytváří se...' : '🎮 Vytvořit místnost'}
            </button>
            <button onClick={() => setMode('choose')} className="w-full py-2 text-zinc-500 hover:text-zinc-300 text-sm">
              ← Zpět
            </button>
          </div>
        )}

        {mode === 'join' && (
          <div className="space-y-3">
            <input
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase().slice(0, 6))}
              placeholder="KÓDMÍST"
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white text-center text-3xl font-mono tracking-widest placeholder-zinc-700 focus:outline-none focus:border-zinc-400 uppercase"
            />
            <button
              onClick={handleJoin}
              disabled={loading || code.length !== 6}
              className="w-full py-4 bg-white text-black rounded-xl font-black text-lg hover:bg-zinc-100 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Připojuji...' : '🔗 Připojit se'}
            </button>
            <button onClick={() => setMode('choose')} className="w-full py-2 text-zinc-500 hover:text-zinc-300 text-sm">
              ← Zpět
            </button>
          </div>
        )}

        <p className="text-center text-zinc-700 text-xs mt-8">
          Obsahuje silný jazyk a dospělý humor. Jen pro 18+.
        </p>
      </div>
    </div>
  )
}