import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const { code, playerName, userId } = await req.json()

  if (!code || !playerName || !userId) {
    return NextResponse.json({ error: 'Chybí parametry' }, { status: 400 })
  }

  const supabase = await createServerSupabaseClient()

  const { data: room, error: roomError } = await supabase
    .from('rooms')
    .select('*')
    .eq('code', code.toUpperCase())
    .single()

  if (roomError || !room) {
    return NextResponse.json({ error: 'Místnost nenalezena' }, { status: 404 })
  }

  if (room.status === 'playing') {
    return NextResponse.json({ error: 'Hra již probíhá' }, { status: 403 })
  }

  const { count } = await supabase
    .from('players')
    .select('*', { count: 'exact', head: true })
    .eq('room_id', room.id)

  if ((count || 0) >= room.settings.max_players) {
    return NextResponse.json({ error: 'Místnost je plná' }, { status: 403 })
  }

  const { data: existingPlayer } = await supabase
    .from('players')
    .select('*')
    .eq('room_id', room.id)
    .eq('user_id', userId)
    .single()

  if (existingPlayer) {
    await supabase
      .from('players')
      .update({ is_connected: true, name: playerName })
      .eq('id', existingPlayer.id)
    return NextResponse.json({ room, player: existingPlayer })
  }

  const { data: player, error: playerError } = await supabase
    .from('players')
    .insert({
      room_id: room.id,
      user_id: userId,
      name: playerName,
      is_host: false,
      score: 0,
      hand: [],
      is_connected: true,
    })
    .select()
    .single()

  if (playerError || !player) {
    return NextResponse.json({ error: 'Chyba při přidání hráče' }, { status: 500 })
  }

  await supabase.from('messages').insert({
    room_id: room.id,
    player_name: 'Systém',
    content: `${playerName} se připojil/a do místnosti`,
    type: 'system',
  })

  return NextResponse.json({ room, player })
}