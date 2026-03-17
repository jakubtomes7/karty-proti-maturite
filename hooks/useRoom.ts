// @ts-nocheck
'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Database, BlackCard, WhiteCard } from '@/lib/supabase/database.types'

type Room = Database['public']['Tables']['rooms']['Row']
type Player = Database['public']['Tables']['players']['Row']
type Round = Database['public']['Tables']['rounds']['Row']
type Submission = Database['public']['Tables']['submissions']['Row']
type Message = Database['public']['Tables']['messages']['Row']
type CustomCard = Database['public']['Tables']['custom_cards']['Row']

export function useRoom(roomId: string, userId: string) {
  const supabase = createClient()

  const [room, setRoom] = useState<Room | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [currentRound, setCurrentRound] = useState<Round | null>(null)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [customCards, setCustomCards] = useState<CustomCard[]>([])
  const [myPlayer, setMyPlayer] = useState<Player | null>(null)
  const [loading, setLoading] = useState(true)

  const loadInitialData = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    const [roomRes, playersRes, messagesRes, customCardsRes] = await Promise.all([
      supabase.from('rooms').select('*').eq('id', roomId).single(),
      supabase.from('players').select('*').eq('room_id', roomId),
      supabase.from('messages').select('*').eq('room_id', roomId).order('created_at').limit(100),
      supabase.from('custom_cards').select('*').eq('room_id', roomId).order('created_at', { ascending: false }),
    ])

    if (roomRes.data) setRoom(roomRes.data)
    if (playersRes.data) {
      setPlayers(playersRes.data)
      setMyPlayer(playersRes.data.find(p => p.user_id === userId) || null)
    }
    if (messagesRes.data) setMessages(messagesRes.data)
    if (customCardsRes.data) setCustomCards(customCardsRes.data)

    if (roomRes.data?.status === 'playing') {
      const { data: rounds } = await supabase
        .from('rounds')
        .select('*')
        .eq('room_id', roomId)
        .neq('status', 'finished')
        .order('round_number', { ascending: false })
        .limit(1)

      if (rounds?.[0]) {
        setCurrentRound(rounds[0])
        const { data: subs } = await supabase
          .from('submissions')
          .select('*')
          .eq('round_id', rounds[0].id)
        if (subs) setSubmissions(subs)
      }
    }

    setLoading(false)
  }, [roomId, userId])

  useEffect(() => {
    loadInitialData()

    const channel = supabase
      .channel(`room:${roomId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'rooms',
        filter: `id=eq.${roomId}`,
      }, (payload) => {
        if (payload.new) setRoom(payload.new as Room)
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'players',
        filter: `room_id=eq.${roomId}`,
      }, (payload) => {
        setPlayers(prev => {
          if (payload.eventType === 'INSERT') {
            return [...prev, payload.new as Player]
          }
          if (payload.eventType === 'UPDATE') {
            const updated = prev.map(p => p.id === (payload.new as Player).id ? payload.new as Player : p)
            setMyPlayer(updated.find(p => p.user_id === userId) || null)
            return updated
          }
          if (payload.eventType === 'DELETE') {
            return prev.filter(p => p.id !== (payload.old as Player).id)
          }
          return prev
        })
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'custom_cards',
        filter: `room_id=eq.${roomId}`,
      }, (payload) => {
        setCustomCards(prev => {
          if (payload.eventType === 'INSERT') {
            return [payload.new as CustomCard, ...prev]
          }
          if (payload.eventType === 'DELETE') {
            return prev.filter(c => c.id !== (payload.old as CustomCard).id)
          }
          return prev
        })
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'rounds',
        filter: `room_id=eq.${roomId}`,
      }, (payload) => {
        if (payload.new) {
          const newRound = payload.new as Round
          // Když začne nové kolo, vymaž submissions
          if (newRound.status === 'picking') {
            setSubmissions([])
          }
          setCurrentRound(newRound)
        }
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'submissions',
        filter: `room_id=eq.${roomId}`,
      }, (payload) => {
        setSubmissions(prev => {
          if (payload.eventType === 'INSERT') {
            return [...prev, payload.new as Submission]
          }
          if (payload.eventType === 'UPDATE') {
            return prev.map(s => s.id === (payload.new as Submission).id ? payload.new as Submission : s)
          }
          return prev
        })
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `room_id=eq.${roomId}`,
      }, (payload) => {
        setMessages(prev => [...prev, payload.new as Message])
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [roomId, userId])

  const sendMessage = useCallback(async (content: string) => {
    if (!myPlayer) return
    await supabase.from('messages').insert({
      room_id: roomId,
      player_id: myPlayer.id,
      player_name: myPlayer.name,
      content,
      type: 'chat',
    })
  }, [roomId, myPlayer])

  const submitCards = useCallback(async (selectedCards: WhiteCard[]) => {
    if (!myPlayer || !currentRound) return
    await supabase.from('submissions').insert({
      round_id: currentRound.id,
      room_id: roomId,
      player_id: myPlayer.id,
      cards: selectedCards,
    })

    // Zkontroluj jestli všichni (kromě czara) odevzdali
    const { data: subs } = await supabase
      .from('submissions')
      .select('*')
      .eq('round_id', currentRound.id)

    const nonCzarPlayers = players.filter(p => p.id !== currentRound.czar_id)
    if (subs && subs.length >= nonCzarPlayers.length) {
      await supabase
        .from('rounds')
        .update({ status: 'judging' })
        .eq('id', currentRound.id)
    }
  }, [myPlayer, currentRound, roomId, players])

  const pickWinner = useCallback(async (submissionId: string, winnerId: string) => {
    if (!currentRound) return

    // Označ vítěze
    await supabase.from('submissions').update({ is_winner: true }).eq('id', submissionId)
    await supabase.from('players').update({ score: (players.find(p => p.id === winnerId)?.score || 0) + 1 }).eq('id', winnerId)
    await supabase.from('rounds').update({ status: 'finished', winner_id: winnerId, finished_at: new Date().toISOString() }).eq('id', currentRound.id)

    // Načti game state pro deck
    const { data: gameState } = await supabase
      .from('game_state')
      .select('*')
      .eq('room_id', roomId)
      .single()

    if (!gameState) return

    // Vytáhni novou černou kartu
    const { drawBlackCard, drawWhiteCards } = await import('@/lib/game-logic')
    let deckState = {
      blackDeck: gameState.black_deck,
      whiteDeck: gameState.white_deck,
      discardBlack: gameState.discard_black,
      discardWhite: gameState.discard_white,
    }

    const { card: newBlack, deck: deckAfterBlack } = drawBlackCard(deckState)
    if (!newBlack) return

    // Doplň karty hráčům – nejdřív načti aktuální submissions abychom věděli co odebrali
    const { data: allSubs } = await supabase
      .from('submissions')
      .select('*')
      .eq('round_id', currentRound.id)

    for (const player of players) {
      const hand = (player.hand as unknown as WhiteCard[]) || []
      
      // Najdi karty které tento hráč odevzdal
      const playerSub = allSubs?.find(s => s.player_id === player.id)
      const submittedIds = playerSub ? (playerSub.cards as WhiteCard[]).map(c => c.id) : []
      
      // Odeber odevzdané karty z ruky
      const remainingHand = hand.filter(c => !submittedIds.includes(c.id))
      
      // Doplň na 10
      const needed = 10 - remainingHand.length
      if (needed > 0) {
        const { cards, deck } = drawWhiteCards(deckState, needed)
        deckState = deck
        await supabase.from('players').update({ hand: [...remainingHand, ...cards] }).eq('id', player.id)
      } else {
        await supabase.from('players').update({ hand: remainingHand }).eq('id', player.id)
      }
    }

    // Ulož nový deck state
    await supabase.from('game_state').update({
      black_deck: deckAfterBlack.blackDeck,
      white_deck: deckAfterBlack.whiteDeck,
      discard_black: deckAfterBlack.discardBlack,
      discard_white: deckAfterBlack.discardWhite,
      updated_at: new Date().toISOString(),
    }).eq('room_id', roomId)

    // Vyber nového czara (další v pořadí)
    const currentCzarIndex = players.findIndex(p => p.id === currentRound.czar_id)
    const nextCzar = players[(currentCzarIndex + 1) % players.length]

    // Vytvoř nové kolo
    await supabase.from('rounds').insert({
      room_id: roomId,
      round_number: currentRound.round_number + 1,
      czar_id: nextCzar.id,
      black_card: newBlack,
      status: 'picking',
    })

    // System zpráva
    await supabase.from('messages').insert({
      room_id: roomId,
      player_name: 'Systém',
      content: `Kolo ${currentRound.round_number + 1} začalo! ${nextCzar.name} je Card Czar.`,
      type: 'system',
    })

  }, [currentRound, players, roomId])

  const addCustomCard = useCallback(async (type: 'black' | 'white', text: string, blanks = 1) => {
    const response = await fetch(`/api/rooms/${roomId}/custom-cards`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, type, text, blanks }),
    })
    return response.json()
  }, [roomId, userId])

  const addBulkCards = useCallback(async (rawText: string) => {
    const lines = rawText.split('\n').filter(l => l.trim())
    const blacks: string[] = []
    const whites: string[] = []

    for (const line of lines) {
      const trimmed = line.trim()
      if (trimmed.toUpperCase().startsWith('BLACK:')) {
        blacks.push(trimmed.substring(6).trim())
      } else if (trimmed.toUpperCase().startsWith('WHITE:')) {
        whites.push(trimmed.substring(6).trim())
      }
    }

    const promises = []
    if (blacks.length > 0) {
      promises.push(
        fetch(`/api/rooms/${roomId}/custom-cards`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, type: 'black', text: blacks, blanks: 1 }),
        })
      )
    }
    if (whites.length > 0) {
      promises.push(
        fetch(`/api/rooms/${roomId}/custom-cards`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, type: 'white', text: whites }),
        })
      )
    }

    await Promise.all(promises)
    return { blacks: blacks.length, whites: whites.length }
  }, [roomId, userId])

  const deleteCustomCard = useCallback(async (cardId: string) => {
    await fetch(`/api/rooms/${roomId}/custom-cards`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, cardId }),
    })
  }, [roomId, userId])

  return {
    room, players, currentRound, submissions, messages, customCards, myPlayer, loading,
    sendMessage, submitCards, pickWinner,
    addCustomCard, addBulkCards, deleteCustomCard,
    isHost: room?.host_id === userId,
    isCzar: currentRound?.czar_id === myPlayer?.id,
    reload: loadInitialData,
  }
}