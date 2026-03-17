import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { buildDecks, drawBlackCard, drawWhiteCards } from '@/lib/game-logic'
import type { BlackCard, WhiteCard } from '@/lib/supabase/database.types'

export async function POST(req: Request, { params }: { params: Promise<{ roomId: string }> }) {
  const { userId } = await req.json()
  const { roomId } = await params

  const supabase = await createServerSupabaseClient()

  const { data: room } = await supabase
    .from('rooms')
    .select('*')
    .eq('id', roomId)
    .single()

  if (!room || room.host_id !== userId) {
    return NextResponse.json({ error: 'Pouze host může spustit hru' }, { status: 403 })
  }

  const { data: players } = await supabase
    .from('players')
    .select('*')
    .eq('room_id', roomId)
    .eq('is_connected', true)

  if (!players || players.length < 3) {
    return NextResponse.json({ error: 'Potřebujete alespoň 3 hráče' }, { status: 400 })
  }

  const { data: customCards } = await supabase
    .from('custom_cards')
    .select('*')
    .eq('room_id', roomId)

  const customBlack: BlackCard[] = (customCards || [])
    .filter(c => c.type === 'black')
    .map(c => ({ id: c.id, text: c.text, blanks: c.blanks, isCustom: true }))

  const customWhite: WhiteCard[] = (customCards || [])
    .filter(c => c.type === 'white')
    .map(c => ({ id: c.id, text: c.text, isCustom: true }))

  let deckState = buildDecks(customBlack, customWhite)

  const playerUpdates = []
  for (const player of players) {
    const { cards, deck } = drawWhiteCards(deckState, room.settings.hand_size)
    deckState = deck
    playerUpdates.push(
      supabase.from('players').update({ hand: cards, score: 0 }).eq('id', player.id)
    )
  }

  await Promise.all(playerUpdates)

  const { card: firstBlack, deck: deckAfterBlack } = drawBlackCard(deckState)

  await supabase.from('game_state').upsert({
    room_id: roomId,
    black_deck: deckAfterBlack.blackDeck,
    white_deck: deckAfterBlack.whiteDeck,
    discard_black: deckAfterBlack.discardBlack,
    discard_white: deckAfterBlack.discardWhite,
  })

  const czar = players[Math.floor(Math.random() * players.length)]

  const { data: round } = await supabase
    .from('rounds')
    .insert({
      room_id: roomId,
      round_number: 1,
      czar_id: czar.id,
      black_card: firstBlack,
      status: 'picking',
    })
    .select()
    .single()

  await supabase
    .from('rooms')
    .update({ status: 'playing' })
    .eq('id', roomId)

  await supabase.from('messages').insert({
    room_id: roomId,
    player_name: 'Systém',
    content: `Hra začala! ${czar.name} je Card Czar v prvním kole.`,
    type: 'system',
  })

  return NextResponse.json({ success: true, round })
}