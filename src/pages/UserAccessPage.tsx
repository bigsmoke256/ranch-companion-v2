import { useState } from 'react';
import { format } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Profile, AppRole } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Users, Shield, Briefcase, Stethoscope, User, Search, Mail, Phone, MapPin, Building } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';

const roleIcons: Record<string, typeof User> = {
  farm_manager: Briefcase,
  vet: Stethoscope,
  client: User,
  admin: Shield,
  staff: User,
  farmer: Shield,
};

const roleLabels: Record<string, string> = {
  farm_manager: 'Farm Manager',
  vet: 'Veterinary Doctor',
  client: 'Client',
  admin: 'Administrator',
  staff: 'Staff',
  farmer: 'Farmer (Owner)',
};

const roleBadgeColors: Record<string, string> = {
  farm_manager: 'bg-blue-100 text-blue-800 border-blue-200',
  vet: 'bg-green-100 text-green-800 border-green-200',
  client: 'bg-gray-100 text-gray-800 border-gray-200',
  admin: 'bg-purple-100 text-purple-800 border-purple-200',
  staff: 'bg-orange-100 text-orange-800 border-orange-200',
  farmer: 'bg-primary/10 text-primary border-primary/30',
};

function useAllUsers() {
  return useQuery({
    queryKey: ['all-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Profile[];
    },
  });
}

interface UserCardProps {
  user: Profile;
}

function UserCard({ user }: UserCardProps) {
  const RoleIcon = roleIcons[user.role] || User;
  const initials = user.full_name 
    ? user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          {/* Profile Photo */}
          <Avatar className="h-16 w-16 border-2 border-muted">
            <AvatarImage src={undefined} alt={user.full_name || 'User'} />
            <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>

          {/* User Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <h3 className="font-semibold text-lg text-foreground truncate">
                  {user.full_name || 'Unnamed User'}
                </h3>
                <Badge variant="outline" className={`${roleBadgeColors[user.role]} mt-1`}>
                  <RoleIcon className="h-3 w-3 mr-1" />
                  {roleLabels[user.role] || user.role}
                </Badge>
              </div>
            </div>

            {/* Contact Details */}
            <div className="space-y-1.5 mt-3 text-sm text-muted-foreground">
              {user.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <span>{user.phone}</span>
                </div>
              )}
              {user.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>{user.location}</span>
                </div>
              )}
              {user.license_number && user.role === 'vet' && (
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  <span>License: {user.license_number}</span>
                </div>
              )}
            </div>

            {/* Join Date */}
            <p className="text-xs text-muted-foreground mt-3">
              Joined {format(new Date(user.created_at), 'MMM d, yyyy')}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function UserAccessPage() {
  const { data: users, isLoading } = useAllUsers();
  const { profile } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');

  const filteredUsers = users?.filter(user => {
    const matchesSearch = 
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone?.includes(searchTerm) ||
      user.location?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    
    return matchesSearch && matchesRole;
  });

  const vets = filteredUsers?.filter(u => u.role === 'vet') || [];
  const farmManagers = filteredUsers?.filter(u => u.role === 'farm_manager') || [];
  const clients = filteredUsers?.filter(u => u.role === 'client') || [];
  const farmers = filteredUsers?.filter(u => u.role === 'farmer' || u.role === 'admin') || [];

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header with Farmer Info */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">User Access</h1>
            <p className="text-muted-foreground">Manage registered users and their access to your farm</p>
          </div>
          
          {/* Current Farmer Profile */}
          {profile && (
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4 flex items-center gap-4">
                <Avatar className="h-12 w-12 border-2 border-primary/30">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {profile.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'F'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{profile.full_name || 'Farm Owner'}</p>
                  <Badge className="bg-primary/20 text-primary border-0 mt-1">
                    <Shield className="h-3 w-3 mr-1" />
                    Primary Owner
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, phone, or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Role Tabs */}
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all" onClick={() => setSelectedRole('all')}>
              All ({users?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="farmers" onClick={() => setSelectedRole('farmer')}>
              Farmers ({farmers.length})
            </TabsTrigger>
            <TabsTrigger value="vets" onClick={() => setSelectedRole('vet')}>
              Vets ({vets.length})
            </TabsTrigger>
            <TabsTrigger value="managers" onClick={() => setSelectedRole('farm_manager')}>
              Managers ({farmManagers.length})
            </TabsTrigger>
            <TabsTrigger value="clients" onClick={() => setSelectedRole('client')}>
              Clients ({clients.length})
            </TabsTrigger>
          </TabsList>

          {/* All Users Tab */}
          <TabsContent value="all" className="space-y-4">
            {filteredUsers && filteredUsers.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredUsers.map((user) => (
                  <UserCard key={user.id} user={user} />
                ))}
              </div>
            ) : (
              <EmptyState message="No users found" />
            )}
          </TabsContent>

          {/* Farmers Tab */}
          <TabsContent value="farmers" className="space-y-4">
            {farmers.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {farmers.map((user) => (
                  <UserCard key={user.id} user={user} />
                ))}
              </div>
            ) : (
              <EmptyState message="No farmers registered" />
            )}
          </TabsContent>

          {/* Vets Tab */}
          <TabsContent value="vets" className="space-y-4">
            {vets.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {vets.map((user) => (
                  <UserCard key={user.id} user={user} />
                ))}
              </div>
            ) : (
              <EmptyState message="No veterinarians registered" />
            )}
          </TabsContent>

          {/* Managers Tab */}
          <TabsContent value="managers" className="space-y-4">
            {farmManagers.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {farmManagers.map((user) => (
                  <UserCard key={user.id} user={user} />
                ))}
              </div>
            ) : (
              <EmptyState message="No farm managers registered" />
            )}
          </TabsContent>

          {/* Clients Tab */}
          <TabsContent value="clients" className="space-y-4">
            {clients.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {clients.map((user) => (
                  <UserCard key={user.id} user={user} />
                ))}
              </div>
            ) : (
              <EmptyState message="No clients registered" />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-12">
        <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-semibold mb-2">{message}</h3>
        <p className="text-muted-foreground text-center">
          Users will appear here once they register
        </p>
      </CardContent>
    </Card>
  );
}
