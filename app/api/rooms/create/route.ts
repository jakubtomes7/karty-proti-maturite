// @ts-nocheck
import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { generateRoomCode } from '@/lib/utils'

export async function POST(req: Request) {
  const { hostName, userId } = await req.json()

  if (!hostName || !userId) {
    return NextResponse.json({ error: 'Chybí hostName nebo userId' }, { status: 400 })
  }

  const supabase = await createServerSupabaseClient()

  let code = generateRoomCode()
  let attempts = 0
  while (attempts < 10) {
    const { data: existing } = await supabase
      .from('rooms')
      .select('id')
      .eq('code', code)
      .single()
    if (!existing) break
    code = generateRoomCode()
    attempts++
  }

  const { data: room, error: roomError } = await supabase
    .from('rooms')
    .insert({
      code,
      host_id: userId,
      host_name: hostName,
      status: 'lobby',
      settings: {
        max_players: 15,
        hand_size: 10,
        winning_score: 7,
        round_timer: 90,
      },
    })
    .select()
    .single()

  if (roomError || !room) {
    return NextResponse.json({ error: 'Chyba při vytváření místnosti' }, { status: 500 })
  }

  const { error: playerError } = await supabase.from('players').insert({
    room_id: room.id,
    user_id: userId,
    name: hostName,
    is_host: true,
    score: 0,
    hand: [],
    is_connected: true,
  })

  if (playerError) {
    await supabase.from('rooms').delete().eq('id', room.id)
    return NextResponse.json({ error: 'Chyba při přidání hosta' }, { status: 500 })
  }

  return NextResponse.json({ room, code })
}