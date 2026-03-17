// @ts-nocheck
import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET(req: Request, { params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('custom_cards')
    .select('*')
    .eq('room_id', roomId)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ cards: data })
}

export async function POST(req: Request, { params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params
  const { userId, type, text, blanks } = await req.json()
  const supabase = await createServerSupabaseClient()

  const { data: rooms } = await supabase
    .from('rooms')
    .select('*')
    .eq('id', roomId)

  const room = rooms?.[0] as any

  if (!room || room.host_id !== userId) {
    return NextResponse.json({ error: 'Pouze host může přidávat karty' }, { status: 403 })
  }

  const cards = Array.isArray(text)
    ? text.map((t: string) => ({
        room_id: roomId,
        created_by: userId,
        type,
        text: t.trim(),
        blanks: type === 'black' ? (blanks || 1) : 1,
      }))
    : [{
        room_id: roomId,
        created_by: userId,
        type,
        text: text.trim(),
        blanks: type === 'black' ? (blanks || 1) : 1,
      }]

  const { data, error } = await supabase
    .from('custom_cards')
    .insert(cards)
    .select()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ cards: data })
}

export async function DELETE(req: Request, { params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params
  const { userId, cardId } = await req.json()
  const supabase = await createServerSupabaseClient()

  const { data: rooms } = await supabase
    .from('rooms')
    .select('*')
    .eq('id', roomId)

  const room = rooms?.[0] as any

  if (!room || room.host_id !== userId) {
    return NextResponse.json({ error: 'Pouze host může mazat karty' }, { status: 403 })
  }

  const { error } = await supabase
    .from('custom_cards')
    .delete()
    .eq('id', cardId)
    .eq('room_id', roomId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}