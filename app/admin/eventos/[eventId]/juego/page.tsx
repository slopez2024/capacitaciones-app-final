'use client'

import { useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Spinner from '@/components/ui/Spinner'

export default function JuegoAdminPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = use(params)
  const router = useRouter()

  useEffect(() => {
    router.push(`/admin/eventos/${eventId}`)
  }, [eventId])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Spinner size="lg" />
    </div>
  )
}