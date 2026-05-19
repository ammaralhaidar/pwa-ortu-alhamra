'use client'

import { useEffect } from 'react'
import { registerServiceWorker } from '@/lib/push'

export default function NotificationInit() {
  useEffect(() => {
    registerServiceWorker()
  }, [])

  return null
}
