import { useCallback, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { getFeedUnreadCount } from '../services/feed'
import {
  getMinhasDemandasUnreadCount,
  getTriagemUnreadCount,
} from '../services/tickets'

const STORAGE_PREFIX = 'espacomaker:lastVisited:'
/** Data antiga: quando nunca visitou a seção, tudo conta como não lido. */
const NEVER_VISITED = '2000-01-01T00:00:00.000Z'

function getStored(key: string): string {
  try {
    const v = localStorage.getItem(STORAGE_PREFIX + key)
    if (v) return v
  } catch {
    /* ignore */
  }
  return NEVER_VISITED
}

function setStored(key: string, value: string): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, value)
  } catch {
    /* ignore */
  }
}

export interface UnreadCounts {
  feed: number
  minhas: number
  triagem: number
}

export function useUnreadCounts(userId: string | undefined) {
  const location = useLocation()
  const [counts, setCounts] = useState<UnreadCounts>({
    feed: 0,
    minhas: 0,
    triagem: 0,
  })

  const fetchCounts = useCallback(async () => {
    const feedSince = getStored('feed')
    const minhasSince = getStored('minhas')
    const triagemSince = getStored('triagem')

    const [feedCount, minhasCount, triagemCount] = await Promise.all([
      getFeedUnreadCount(feedSince),
      userId
        ? getMinhasDemandasUnreadCount(userId, minhasSince.slice(0, 10))
        : Promise.resolve(0),
      getTriagemUnreadCount(triagemSince.slice(0, 10)),
    ])

    setCounts({
      feed: feedCount,
      minhas: minhasCount,
      triagem: triagemCount,
    })
  }, [userId])

  useEffect(() => {
    const path = location.pathname
    const now = new Date().toISOString()
    if (path === '/feed') {
      setStored('feed', now)
    } else if (path === '/demandas/minhas') {
      setStored('minhas', now)
    } else if (path === '/triagem') {
      setStored('triagem', now)
    }
    if (userId !== undefined) {
      fetchCounts()
    }
  }, [location.pathname, userId, fetchCounts])

  useEffect(() => {
    if (userId === undefined) return
    const t = setInterval(fetchCounts, 60_000)
    return () => clearInterval(t)
  }, [userId, fetchCounts])

  useEffect(() => {
    if (userId === undefined) return
    const onFocus = () => void fetchCounts()
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [userId, fetchCounts])

  return counts
}
