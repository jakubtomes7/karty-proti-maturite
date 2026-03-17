// @ts-nocheck
'use client'

import { useState } from 'react'
import { Plus, Trash2, Upload, X, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import type { Database } from '@/lib/supabase/database.types'

type CustomCard = Database['public']['Tables']['custom_cards']['Row']

interface Props {
  cards: CustomCard[]
  onAdd: (type: 'black' | 'white', text: string, blanks?: number) => Promise<void>
  onBulkAdd: (raw: string) => Promise<{ blacks: number; whites: number }>
  onDelete: (id: string) => Promise<void>
}

export function CustomCardManager({ cards, onAdd, onBulkAdd, onDelete }: Props) {
  const [tab, setTab] = useState<'single' | 'bulk' | 'list'>('list')
  const [type, setType] = useState<'black' | 'white'>('white')
  const [text, setText] = useState('')
  const [blanks, setBlanks] = useState(1)
  const [bulkText, setBulkText] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSingleAdd = async () => {
    if (!text.trim()) return toast.error('Zadej text karty')
    setLoading(true)
    try {
      await onAdd(type, text.trim(), blanks)
      setText('')
      toast.success(`${type === 'black' ? 'Černá' : 'Bílá'} karta přidána!`)
    } catch {
      toast.error('Chyba při přidávání karty')
    }
    setLoading(false)
  }

  const handleBulkAdd = async () => {
    if (!bulkText.trim()) return toast.error('Zadej karty')
    setLoading(true)
    try {
      const result = await onBulkAdd(bulkText)
      setBulkText('')
      toast.success(`Přidáno ${result.blacks} černých + ${result.whites} bílých karet`)
    } catch {
      toast.error('Chyba při hromadném přidávání')
    }
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    setLoading(true)
    try {
      await onDelete(id)
      setDeleteConfirm(null)
      toast.success('Karta smazána')
    } catch {
      toast.error('Chyba při mazání')
    }
    setLoading(false)
  }

  const blackCards = cards.filter(c => c.type === 'black')
  const whiteCards = cards.filter(c => c.type === 'white')

  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-4 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">🛠</span>
        <h3 className="text-lg font-bold text-white">Správa vlastních karet</h3>
        <span className="ml-auto text-xs text-zinc-400">
          {blackCards.length} černých · {whiteCards.length} bílých
        </span>
      </div>

      <div className="flex gap-1 bg-zinc-800 rounded-lg p-1">
        {(['list', 'single', 'bulk'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-colors ${
              tab === t ? 'bg-zinc-600 text-white' : 'text-zinc-400 hover:text-white'
            }`}
          >
            {t === 'list' ? '📋 Seznam' : t === 'single' ? '➕ Přidat' : '📤 Hromadně'}
          </button>
        ))}
      </div>

      {tab === 'single' && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <button
              onClick={() => setType('white')}
              className={`flex-1 py-2 rounded-lg text-sm font-bold border-2 transition-colors ${
                type === 'white'
                  ? 'bg-white text-black border-white'
                  : 'bg-transparent text-zinc-400 border-zinc-600'
              }`}
            >
              ⬜ Bílá karta
            </button>
            <button
              onClick={() => setType('black')}
              className={`flex-1 py-2 rounded-lg text-sm font-bold border-2 transition-colors ${
                type === 'black'
                  ? 'bg-zinc-950 text-white border-zinc-400'
                  : 'bg-transparent text-zinc-400 border-zinc-600'
              }`}
            >
              ⬛ Černá karta
            </button>
          </div>

          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder={
              type === 'black'
                ? 'Text otázky – použij _____ pro prázdné místo'
                : 'Text odpovědi'
            }
            rows={3}
            className="w-full bg-zinc-800 border border-zinc-600 rounded-lg p-3 text-white text-sm resize-none focus:outline-none focus:border-zinc-400"
          />

          {type === 'black' && (
            <div className="flex items-center gap-3">
              <span className="text-zinc-400 text-sm">Počet prázdných míst:</span>
              {[1, 2, 3].map(n => (
                <button
                  key={n}
                  onClick={() => setBlanks(n)}
                  className={`w-8 h-8 rounded-full text-sm font-bold transition-colors ${
                    blanks === n ? 'bg-white text-black' : 'bg-zinc-700 text-zinc-300'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          )}

          <button
            onClick={handleSingleAdd}
            disabled={loading || !text.trim()}
            className="w-full py-2.5 bg-white text-black rounded-lg font-bold text-sm hover:bg-zinc-100 disabled:opacity-40 transition-colors flex items-center justify-center gap-2"
          >
            <Plus size={16} />
            Přidat kartu
          </button>
        </div>
      )}

      {tab === 'bulk' && (
        <div className="space-y-3">
          <div className="bg-zinc-800 rounded-lg p-3 text-xs text-zinc-400 font-mono">
            <p className="text-zinc-300 font-bold mb-1">Formát:</p>
            <p>BLACK: Text černé karty s _____ mezerou</p>
            <p>WHITE: Text bílé karty</p>
          </div>

          <textarea
            value={bulkText}
            onChange={e => setBulkText(e.target.value)}
            placeholder={`BLACK: Když profesor _____ místo zkoušení\nWHITE: Zakázaný slabikář`}
            rows={8}
            className="w-full bg-zinc-800 border border-zinc-600 rounded-lg p-3 text-white text-sm resize-none focus:outline-none focus:border-zinc-400 font-mono"
          />

          <button
            onClick={handleBulkAdd}
            disabled={loading || !bulkText.trim()}
            className="w-full py-2.5 bg-white text-black rounded-lg font-bold text-sm hover:bg-zinc-100 disabled:opacity-40 transition-colors flex items-center justify-center gap-2"
          >
            <Upload size={16} />
            Importovat karty
          </button>
        </div>
      )}

      {tab === 'list' && (
        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {cards.length === 0 && (
            <div className="text-center py-8 text-zinc-500">
              <p className="text-2xl mb-2">🃏</p>
              <p className="text-sm">Zatím žádné vlastní karty</p>
              <p className="text-xs">Přidej je v záložce "Přidat"</p>
            </div>
          )}

          {blackCards.length > 0 && (
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Černé ({blackCards.length})</p>
              {blackCards.map(card => (
                <CardRow
                  key={card.id}
                  card={card}
                  onDelete={id => setDeleteConfirm(id)}
                  isConfirming={deleteConfirm === card.id}
                  onConfirm={() => handleDelete(card.id)}
                  onCancel={() => setDeleteConfirm(null)}
                />
              ))}
            </div>
          )}

          {whiteCards.length > 0 && (
            <div className="mt-3">
              <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Bílé ({whiteCards.length})</p>
              {whiteCards.map(card => (
                <CardRow
                  key={card.id}
                  card={card}
                  onDelete={id => setDeleteConfirm(id)}
                  isConfirming={deleteConfirm === card.id}
                  onConfirm={() => handleDelete(card.id)}
                  onCancel={() => setDeleteConfirm(null)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function CardRow({ card, onDelete, isConfirming, onConfirm, onCancel }: {
  card: any
  onDelete: (id: string) => void
  isConfirming: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div className={`flex items-start gap-2 p-2 rounded-lg mb-1 ${
      card.type === 'black' ? 'bg-zinc-950 border border-zinc-700' : 'bg-zinc-800'
    }`}>
      <span className={`text-xs mt-0.5 px-1.5 py-0.5 rounded font-bold ${
        card.type === 'black' ? 'bg-zinc-700 text-zinc-300' : 'bg-zinc-600 text-white'
      }`}>
        {card.type === 'black' ? '⬛' : '⬜'}
      </span>
      <p className="flex-1 text-sm text-zinc-200 leading-relaxed">{card.text}</p>
      {!isConfirming ? (
        <button
          onClick={() => onDelete(card.id)}
          className="text-zinc-500 hover:text-red-400 transition-colors mt-0.5 flex-shrink-0"
        >
          <Trash2 size={14} />
        </button>
      ) : (
        <div className="flex items-center gap-1">
          <AlertTriangle size={12} className="text-yellow-400" />
          <button onClick={onConfirm} className="text-xs text-red-400 hover:text-red-300 font-bold">
            Smazat
          </button>
          <button onClick={onCancel} className="text-xs text-zinc-400 hover:text-white">
            <X size={12} />
          </button>
        </div>
      )}
    </div>
  )
}