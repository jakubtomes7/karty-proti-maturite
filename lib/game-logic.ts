import type { BlackCard, WhiteCard } from './supabase/database.types'
import { DEFAULT_BLACK_CARDS, DEFAULT_WHITE_CARDS, shuffle } from './cards'

export interface DeckState {
  blackDeck: BlackCard[]
  whiteDeck: WhiteCard[]
  discardBlack: BlackCard[]
  discardWhite: WhiteCard[]
}

export function buildDecks(
  customBlack: BlackCard[],
  customWhite: WhiteCard[]
): DeckState {
  const allBlack = shuffle([...DEFAULT_BLACK_CARDS, ...customBlack])
  const allWhite = shuffle([...DEFAULT_WHITE_CARDS, ...customWhite])

  return {
    blackDeck: allBlack,
    whiteDeck: allWhite,
    discardBlack: [],
    discardWhite: [],
  }
}

export function drawBlackCard(deck: DeckState): {
  card: BlackCard | null
  deck: DeckState
} {
  if (deck.blackDeck.length === 0) {
    if (deck.discardBlack.length === 0) return { card: null, deck }
    const newDeck = shuffle([...deck.discardBlack])
    return drawBlackCard({
      ...deck,
      blackDeck: newDeck,
      discardBlack: [],
    })
  }

  const [card, ...rest] = deck.blackDeck
  return {
    card,
    deck: { ...deck, blackDeck: rest },
  }
}

export function drawWhiteCards(
  deck: DeckState,
  count: number
): { cards: WhiteCard[]; deck: DeckState } {
  let currentDeck = { ...deck }
  const drawn: WhiteCard[] = []

  for (let i = 0; i < count; i++) {
    if (currentDeck.whiteDeck.length === 0) {
      if (currentDeck.discardWhite.length === 0) break
      currentDeck = {
        ...currentDeck,
        whiteDeck: shuffle([...currentDeck.discardWhite]),
        discardWhite: [],
      }
    }
    const [card, ...rest] = currentDeck.whiteDeck
    drawn.push(card)
    currentDeck = { ...currentDeck, whiteDeck: rest }
  }

  return { cards: drawn, deck: currentDeck }
}

export function fillHand(
  hand: WhiteCard[],
  deck: DeckState,
  handSize: number
): { hand: WhiteCard[]; deck: DeckState } {
  const needed = handSize - hand.length
  if (needed <= 0) return { hand, deck }
  const { cards, deck: newDeck } = drawWhiteCards(deck, needed)
  return { hand: [...hand, ...cards], deck: newDeck }
}

export function formatBlackCard(text: string, cards: WhiteCard[]): string {
  let result = text
  cards.forEach((card) => {
    result = result.replace('_____', `**${card.text}**`)
  })
  return result
}