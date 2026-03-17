'use client'

import { useState } from 'react'
import { Crown } from 'lucide-react'
import type { Database, WhiteCard } from '@/lib/supabase/database.types'

type Player = Database['public']['Tables']['players']['Row']
type Round = Database['public']['Tables']['rounds']['Row']
type Submission = Database['public']['Tables']['submissions']['Row']

interface Props {
  round: Round
  players: Player[]
  myPlayer: Player
  submissions: Submission[]
  isCzar: boolean
  isHost: boolean
  onSubmit: (cards: WhiteCard[]) => void
  onPickWinner: (submissionId: string, winnerId: string) => void
}

export function GameBoard({
  round, players, myPlayer, submissions, isCzar, isHost, onSubmit, onPickWinner
}: Props) {
  const [selected, setSelected] = useState<WhiteCard[]>([])
  const mySubmission = submissions.find(s => s.player_id === myPlayer.id)
  const blackCard = round.black_card
  const blanksNeeded = blackCard.blanks
  const hand: WhiteCard[] = (myPlayer.hand as unknown as WhiteCard[]) || []

  const toggleCard = (card: WhiteCard) => {
    if (mySubmission || isCzar) return
    setSelected(prev => {
      const isIn = prev.find(c => c.id === card.id)
      if (isIn) return prev.filter(c => c.id !== card.id)
      if (prev.length >= blanksNeeded) return [...prev.slice(1), card]
      return [...prev, card]
    })
  }

  const handleSubmit = () => {
    if (selected.length !== blanksNeeded) return
    onSubmit(selected)
    setSelected([])
  }

  const renderBlackCard = (cards?: WhiteCard[]) => {
    let text = blackCard.text
    if (cards) {
      cards.forEach(c => {
        text = text.replace('_____', `[${c.text}]`)
      })
    }
    return text
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="border-b border-zinc-800 px-4 py-3 flex items-center gap-4">
        <span className="font-black text-lg">🎓 KPM</span>
        <span className="text-sm text-zinc-400">Kolo {round.round_number}</span>
        <div className="flex items-center gap-3 ml-auto">
          {players.map(p => (
            <div key={p.id} className="flex items-center gap-1">
              {p.id === round.czar_id && <Crown size={12} className="text-yellow-400" />}
              <span className="text-sm">{p.name}</span>
              <span className="text-xs font-bold text-zinc-400">{p.score}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4">
        <div className="mb-6 flex justify-center">
          <div className="bg-zinc-950 border-2 border-zinc-700 rounded-2xl p-6 max-w-sm w-full aspect-[3/4] flex flex-col justify-between">
            <div className="text-xs text-zinc-500 font-bold uppercase tracking-widest">
              🎓 Karty Proti Maturitě
            </div>
            <p className="text-xl font-bold leading-relaxed text-white">
              {blackCard.text}
            </p>
            <div className="text-xs text-zinc-500">
              Vyber {blanksNeeded} {blanksNeeded === 1 ? 'kartu' : 'karty'}
            </div>
          </div>
        </div>

        {round.status === 'picking' && (
          <>
            {isCzar && (
              <div className="text-center mb-4 text-zinc-400">
                <Crown size={24} className="mx-auto mb-2 text-yellow-400" />
                <p>Jsi Card Czar – čekej až ostatní vyberou karty</p>
                <p className="text-sm mt-1">
                  Odevzdáno: {submissions.length}/{players.length - 1}
                </p>
              </div>
            )}

            {!isCzar && !mySubmission && (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 mb-4">
                  {hand.map(card => {
                    const isSelected = selected.find(c => c.id === card.id)
                    return (
                      <button
                        key={card.id}
                        onClick={() => toggleCard(card)}
                        className={`p-3 rounded-xl text-sm text-left transition-all border-2 ${
                          isSelected
                            ? 'bg-white text-black border-white scale-105'
                            : 'bg-zinc-900 text-white border-zinc-700 hover:border-zinc-500'
                        }`}
                      >
                        {card.text}
                        {(card as any).isCustom && (
                          <span className="block text-xs mt-1 opacity-50">✨ vlastní</span>
                        )}
                      </button>
                    )
                  })}
                </div>
                <div className="text-center">
                  <p className="text-sm text-zinc-400 mb-3">
                    Vybráno: {selected.length}/{blanksNeeded}
                  </p>
                  <button
                    onClick={handleSubmit}
                    disabled={selected.length !== blanksNeeded}
                    className="px-8 py-3 bg-white text-black rounded-xl font-black hover:bg-zinc-100 disabled:opacity-40"
                  >
                    Odevzdat
                  </button>
                </div>
              </>
            )}

            {mySubmission && !isCzar && (
              <div className="text-center text-zinc-400">
                <p>✓ Karty odevzdány – čekej na ostatní</p>
                <p className="text-sm mt-1">
                  Odevzdáno: {submissions.length}/{players.length - 1}
                </p>
              </div>
            )}
          </>
        )}

        {round.status === 'judging' && (
          <div>
            <h2 className="text-center text-xl font-bold mb-4">
              {isCzar ? '👑 Vyber vítěze!' : '⏳ Card Czar vybírá...'}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {submissions.map((sub, i) => (
                <button
                  key={sub.id}
                  onClick={() => isCzar && onPickWinner(sub.id, sub.player_id)}
                  disabled={!isCzar}
                  className={`p-4 bg-zinc-900 border-2 border-zinc-700 rounded-xl text-left transition-all ${
                    isCzar ? 'hover:border-white hover:bg-zinc-800 cursor-pointer' : 'cursor-default'
                  } ${sub.is_winner ? 'border-yellow-400 bg-yellow-950' : ''}`}
                >
                  <p className="text-xs text-zinc-500 mb-2">Sada #{i + 1}</p>
                  <p className="font-medium">
                    {renderBlackCard(sub.cards as WhiteCard[])}
                  </p>
                  {sub.is_winner && (
                    <p className="mt-2 text-yellow-400 font-bold text-sm">🏆 Vítěz!</p>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}