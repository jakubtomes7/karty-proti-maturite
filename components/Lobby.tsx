// @ts-nocheck
'use client'

import { useState } from 'react'
import { Users, Copy, Check, Play, MessageSquare } from 'lucide-react'
import { toast } from 'sonner'
import { CustomCardManager } from './CustomCardManager'
import type { Database } from '@/lib/supabase/database.types'

type Room = Database['public']['Tables']['rooms']['Row']
type Player = Database['public']['Tables']['players']['Row']
type CustomCard = Database['public']['Tables']['custom_cards']['Row']
type Message = Database['public']['Tables']['messages']['Row']

interface Props {
  room: Room
  players: Player[]
  myPlayer: Player
  isHost: boolean
  customCards: CustomCard[]
  messages: Message[]
  onStartGame: () => void
  onSendMessage: (msg: string) => void
  onAddCard: (type: 'black' | 'white', text: string, blanks?: number) => Promise<void>
  onBulkAdd: (raw: string) => Promise<{ blacks: number; whites: number }>
  onDeleteCard: (id: string) => Promise<void>
}

export function Lobby({
  room, players, myPlayer, isHost, customCards, messages,
  onStartGame, onSendMessage, onAddCard, onBulkAdd, onDeleteCard
}: Props) {
  const [copied, setCopied] = useState(false)
  const [chatInput, setChatInput] = useState('')

  const copyCode = () => {
    navigator.clipboard.writeText(room.code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success('Kód zkopírován!')
  }

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatInput.trim()) return
    onSendMessage(chatInput)
    setChatInput('')
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black tracking-tight mb-2">
            🎓 Karty Proti Maturitě
          </h1>
          <p className="text-zinc-400">Lobby · čekání na hráče</p>
        </div>

        <div className="flex items-center justify-center mb-8">
          <div className="bg-zinc-900 border-2 border-zinc-600 rounded-2xl px-8 py-4 flex items-center gap-4">
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Kód místnosti</p>
              <p className="text-5xl font-black tracking-widest text-white font-mono">
                {room.code}
              </p>
            </div>
            <button
              onClick={copyCode}
              className="p-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-colors"
            >
              {copied ? <Check size={20} className="text-green-400" /> : <Copy size={20} />}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-4">
              <Users size={18} />
              <h2 className="font-bold">Hráči ({players.length}/{room.settings.max_players})</h2>
            </div>
            <div className="space-y-2">
              {players.map(player => (
                <div
                  key={player.id}
                  className={`flex items-center gap-2 p-2 rounded-lg ${
                    player.id === myPlayer?.id ? 'bg-zinc-800' : ''
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full ${player.is_connected ? 'bg-green-400' : 'bg-zinc-600'}`} />
                  <span className="text-sm font-medium">{player.name}</span>
                  {player.is_host && (
                    <span className="ml-auto text-xs bg-yellow-900 text-yellow-300 px-2 py-0.5 rounded-full">
                      host
                    </span>
                  )}
                  {player.id === myPlayer?.id && !player.is_host && (
                    <span className="ml-auto text-xs text-zinc-500">ty</span>
                  )}
                </div>
              ))}
            </div>

            {isHost && (
              <button
                onClick={onStartGame}
                disabled={players.length < 3}
                className="w-full mt-4 py-3 bg-white text-black rounded-xl font-black text-sm hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                <Play size={18} />
                {players.length < 3
                  ? `Potřeba ${3 - players.length} více hráčů`
                  : 'Spustit hru'
                }
              </button>
            )}
          </div>

          {isHost && (
            <div className="lg:col-span-2">
              <CustomCardManager
                cards={customCards}
                onAdd={onAddCard}
                onBulkAdd={onBulkAdd}
                onDelete={onDeleteCard}
              />
            </div>
          )}

          <div className={`bg-zinc-900 border border-zinc-700 rounded-xl p-4 flex flex-col ${isHost ? 'lg:col-span-3' : 'lg:col-span-2'}`}>
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare size={18} />
              <h2 className="font-bold">Chat</h2>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 min-h-32 max-h-48 mb-3">
              {messages.map(msg => (
                <div key={msg.id} className={`text-sm ${msg.type === 'system' ? 'text-zinc-500 italic' : ''}`}>
                  {msg.type === 'chat' && (
                    <span className="font-bold text-zinc-300">{msg.player_name}: </span>
                  )}
                  {msg.content}
                </div>
              ))}
            </div>
            <form onSubmit={handleSend} className="flex gap-2">
              <input
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                placeholder="Napiš zprávu..."
                className="flex-1 bg-zinc-800 border border-zinc-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-400"
              />
              <button
                type="submit"
                disabled={!chatInput.trim()}
                className="px-4 py-2 bg-white text-black rounded-lg text-sm font-bold hover:bg-zinc-100 disabled:opacity-40"
              >
                ›
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}