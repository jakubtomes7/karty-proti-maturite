import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 6 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join('')
}

export function getUserId(): string {
  if (typeof window === 'undefined') return ''
  let id = localStorage.getItem('kpm_user_id')
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem('kpm_user_id', id)
  }
  return id
}

export function getUserName(): string {
  if (typeof window === 'undefined') return ''
  return localStorage.getItem('kpm_user_name') || ''
}

export function setUserName(name: string): void {
  localStorage.setItem('kpm_user_name', name)
}