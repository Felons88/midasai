'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Menu, X, Home, Search, User, Settings, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export function MobileNavigation() {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const navItems = [
    { icon: Home, label: 'Home', href: '/' },
    { icon: Search, label: 'Explore', href: '/explore' },
    { icon: User, label: 'Profile', href: '/profile' },
    { icon: Settings, label: 'Settings', href: '/settings' },
  ]

  return (
    <>
      <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setOpen(true)}>
        <Menu className="h-5 w-5" />
        <span className="sr-only">Toggle menu</span>
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm md:hidden">
          <div className="fixed inset-y-0 left-0 w-[300px] sm:w-[400px] bg-background p-6">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-bold">Menu</h2>
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            <nav className="flex flex-col gap-2">
              {navItems.map((item) => (
                <Button
                  key={item.href}
                  variant="ghost"
                  className="justify-start"
                  onClick={() => {
                    router.push(item.href)
                    setOpen(false)
                  }}
                >
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.label}
                </Button>
              ))}
              
              <div className="border-t border-white/10 my-4" />
              
              <Button
                variant="ghost"
                className="justify-start text-red-400 hover:text-red-300"
                onClick={handleSignOut}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </nav>
          </div>
        </div>
      )}
    </>
  )
}
