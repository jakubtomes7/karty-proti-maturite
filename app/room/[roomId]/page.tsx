'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getUserId } from '@/lib/utils'
import { useRoom } from '@/hooks/useRoom'
import { Lobby } from '@/components/Lobby'
import { GameBoard } from '@/components/GameBoard'
import { Toaster, toast } from 'sonner'

function RoomContent({ roomId, userId }: { roomId: string, userId: string }) {
  const router = useRouter()
  const {
    room, players, currentRound, submissions, messages, customCards, myPlayer, loading,
    sendMessage, submitCards, pickWinner,
    addCustomCard, addBulkCards, deleteCustomCard,
    isHost, isCzar,
  } = useRoom(roomId, userId)

  const handleStartGame = async () => {
    const res = await fetch(`/api/rooms/${roomId}/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    })
    const data = await res.json()
    if (data.error) toast.error(data.error)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-white text-xl">Načítání...</div>
      </div>
    )
  }

  if (!room || !myPlayer) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-xl mb-4">Místnost nenalezena</p>
          <button onClick={() => router.push('/')} className="text-zinc-400 hover:text-white">
            ← Zpět na hlavní stránku
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <Toaster theme="dark" position="top-center" />
      {room.status === 'lobby' ? (
        <Lobby
          room={room}
          players={players}
          myPlayer={myPlayer}
          isHost={isHost}
          customCards={customCards}
          messages={messages}
          onStartGame={handleStartGame}
          onSendMessage={sendMessage}
          onAddCard={addCustomCard}
          onBulkAdd={addBulkCards}
          onDeleteCard={deleteCustomCard}
        />
      ) : currentRound ? (
        <GameBoard
          round={currentRound}
          players={players}
          myPlayer={myPlayer}
          submissions={submissions}
          isCzar={isCzar}
          isHost={isHost}
          onSubmit={submitCards}
          onPickWinner={pickWinner}
        />
      ) : (
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-white">
          Načítání kola...
        </div>
      )}
    </>
  )
}

export default function RoomPage() {
  const params = useParams()
  const roomId = params.roomId as string
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    setUserId(getUserId())
  }, [])

  if (!userId) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-white text-xl">Načítání...</div>
      </div>
    )
  }

  return <RoomContent roomId={roomId} userId={userId} />
}