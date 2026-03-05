'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase-browser'

export default function UsersPage() {
  const supabase = createClient()
  const [profiles, setProfiles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase.from('profiles').select('*').limit(500).then(({ data, error: err }) => {
      if (err) setError(err.message)
      else setProfiles(data || [])
      setLoading(false)
    })
  }, [])

  if (loading) return <div className="p-8 text-gray-400">Loading...</div>
  if (error) return <div className="p-8 text-red-500">Error: {error}</div>

  const superadminCount = profiles.filter(p => p.is_superadmin).length

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-1">Users</h1>
      <p className="text-gray-400 mb-8">
        {profiles?.length ?? 0} total profiles — {superadminCount} superadmin{superadminCount !== 1 ? 's' : ''}
      </p>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-6 py-3 font-semibold text-gray-600">ID</th>
              <th className="text-left px-6 py-3 font-semibold text-gray-600">Email</th>
              <th className="text-left px-6 py-3 font-semibold text-gray-600">Role</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {(profiles || []).map(profile => (
              <tr key={profile.id} className="hover:bg-gray-50/50">
                <td className="px-6 py-3 font-mono text-xs text-gray-400 w-72">
                  {profile.id?.toString()}
                </td>
                <td className="px-6 py-3 text-gray-800">
                  {profile.email || profile.username || profile.name || (
                    <span className="text-gray-400 italic">no email</span>
                  )}
                </td>
                <td className="px-6 py-3">
                  {profile.is_superadmin ? (
                    <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700">
                      Superadmin
                    </span>
                  ) : (
                    <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                      User
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
