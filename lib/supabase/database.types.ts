export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      rooms: {
        Row: {
          id: string
          code: string
          host_id: string
          host_name: string
          status: 'lobby' | 'playing' | 'finished'
          settings: {
            max_players: number
            hand_size: number
            winning_score: number
            round_timer: number
          }
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['rooms']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['rooms']['Insert']>
      }
      players: {
        Row: {
          id: string
          room_id: string
          user_id: string
          name: string
          is_host: boolean
          score: number
          hand: CardRef[]
          is_connected: boolean
          joined_at: string
        }
        Insert: Omit<Database['public']['Tables']['players']['Row'], 'id' | 'joined_at'>
        Update: Partial<Database['public']['Tables']['players']['Insert']>
      }
      custom_cards: {
        Row: {
          id: string
          room_id: string
          created_by: string
          type: 'black' | 'white'
          text: string
          blanks: number
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['custom_cards']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['custom_cards']['Insert']>
      }
      rounds: {
        Row: {
          id: string
          room_id: string
          round_number: number
          czar_id: string | null
          black_card: BlackCard
          status: 'picking' | 'judging' | 'finished'
          winner_id: string | null
          started_at: string
          finished_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['rounds']['Row'], 'id' | 'started_at'>
        Update: Partial<Database['public']['Tables']['rounds']['Insert']>
      }
      submissions: {
        Row: {
          id: string
          round_id: string
          room_id: string
          player_id: string
          cards: WhiteCard[]
          is_winner: boolean
          submitted_at: string
        }
        Insert: Omit<Database['public']['Tables']['submissions']['Row'], 'id' | 'submitted_at'>
        Update: Partial<Database['public']['Tables']['submissions']['Insert']>
      }
      messages: {
        Row: {
          id: string
          room_id: string
          player_id: string | null
          player_name: string
          content: string
          type: 'chat' | 'system'
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['messages']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['messages']['Insert']>
      }
      game_state: {
        Row: {
          id: string
          room_id: string
          black_deck: BlackCard[]
          white_deck: WhiteCard[]
          discard_black: BlackCard[]
          discard_white: WhiteCard[]
          current_round_id: string | null
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['game_state']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['game_state']['Insert']>
      }
    }
  }
}

export interface BlackCard {
  id: string
  text: string
  blanks: number
  isCustom?: boolean
}

export interface WhiteCard {
  id: string
  text: string
  isCustom?: boolean
}

export interface CardRef {
  id: string
  text: string
}