'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase-browser'

const sections = [
  {
    label: 'Overview',
    items: [
      { href: '/dashboard', label: 'Statistics', icon: '📊', exact: true },
      { href: '/dashboard/users', label: 'Users', icon: '👥' },
    ],
  },
  {
    label: 'Content',
    items: [
      { href: '/dashboard/images', label: 'Images', icon: '🖼️' },
      { href: '/dashboard/captions', label: 'Captions', icon: '💬' },
      { href: '/dashboard/caption-requests', label: 'Caption Requests', icon: '📥' },
      { href: '/dashboard/caption-examples', label: 'Caption Examples', icon: '✨' },
    ],
  },
  {
    label: 'Humor System',
    items: [
      { href: '/dashboard/humor-flavors', label: 'Humor Flavors', icon: '🎭' },
      { href: '/dashboard/humor-flavor-steps', label: 'Flavor Steps', icon: '📋' },
      { href: '/dashboard/humor-mix', label: 'Humor Mix', icon: '🎛️' },
    ],
  },
  {
    label: 'Vocabulary',
    items: [
      { href: '/dashboard/terms', label: 'Terms', icon: '📖' },
    ],
  },
  {
    label: 'AI / LLM',
    items: [
      { href: '/dashboard/llm-providers', label: 'LLM Providers', icon: '🏭' },
      { href: '/dashboard/llm-models', label: 'LLM Models', icon: '🤖' },
      { href: '/dashboard/llm-prompt-chains', label: 'Prompt Chains', icon: '🔗' },
      { href: '/dashboard/llm-responses', label: 'LLM Responses', icon: '💡' },
    ],
  },
  {
    label: 'Access Control',
    items: [
      { href: '/dashboard/allowed-signup-domains', label: 'Signup Domains', icon: '🌐' },
      { href: '/dashboard/whitelisted-emails', label: 'Whitelisted Emails', icon: '📧' },
    ],
  },
]

export default function Sidebar({ email }: { email: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="w-56 bg-gray-900 text-white flex flex-col h-full flex-shrink-0 overflow-y-auto">
      <div className="px-5 py-5 border-b border-gray-800 flex-shrink-0">
        <p className="font-bold text-white">Humor Admin</p>
        <p className="text-xs text-gray-500 mt-0.5">Superadmin Panel</p>
      </div>

      <nav className="flex-1 px-3 py-3">
        {sections.map((section) => (
          <div key={section.label} className="mb-4">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider px-3 mb-1">
              {section.label}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const active = item.exact
                  ? pathname === item.href
                  : pathname.startsWith(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      active ? 'bg-orange-500 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                    }`}
                  >
                    <span>{item.icon}</span>
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-gray-800 flex-shrink-0">
        <p className="text-xs text-gray-500 px-3 mb-2 truncate">{email}</p>
        <button
          onClick={handleSignOut}
          className="w-full text-left px-3 py-2 text-xs text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
        >
          Sign Out
        </button>
      </div>
    </aside>
  )
}
