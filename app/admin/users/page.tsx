import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/server"

async function getAdminUsers() {
  try {
    const supabase = await createClient()
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)
    
    if (error) {
      console.error('Error fetching users:', error)
      return []
    }
    
    return users || []
  } catch (error) {
    console.error('Error in getAdminUsers:', error)
    return []
  }
}

export default async function AdminUsersPage() {
  const users = await getAdminUsers()

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="ambient-glow" />
      <div className="noise-overlay" />
      
      <div className="container mx-auto px-4 py-12 relative">
        <div className="mb-12 animate-fade-in-up">
          <h1 className="text-5xl md:text-6xl font-bold mb-2 text-text-primary">Users Management</h1>
          <p className="text-xl text-text-secondary">Manage platform users and roles</p>
        </div>

        <Card className="glass animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <CardHeader>
            <CardTitle className="text-2xl text-text-primary">All Users ({users.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left p-4 font-medium text-text-tertiary text-sm">User</th>
                    <th className="text-left p-4 font-medium text-text-tertiary text-sm">Role</th>
                    <th className="text-left p-4 font-medium text-text-tertiary text-sm">Joined</th>
                    <th className="text-left p-4 font-medium text-text-tertiary text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user: any) => (
                    <tr key={user.id} className="border-b border-white/5 hover:bg-surface/50 transition-smooth">
                      <td className="p-4">
                        <div>
                          <p className="font-medium text-text-primary">{user.name || 'Unnamed'}</p>
                          <p className="text-sm text-text-tertiary">{user.email}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          user.role === 'ADMIN' || user.role === 'OWNER'
                            ? 'bg-purple-500/10 text-purple-400'
                            : user.role === 'CREATOR'
                            ? 'bg-blue-500/10 text-blue-400'
                            : user.role === 'MODERATOR'
                            ? 'bg-orange-500/10 text-orange-400'
                            : 'bg-gray-500/10 text-gray-400'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="p-4 text-text-tertiary text-sm">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        <Button variant="outline" size="sm" className="transition-smooth">
                          Manage
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {users.length === 0 && (
              <div className="text-center py-12">
                <p className="text-text-tertiary">No users found.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
