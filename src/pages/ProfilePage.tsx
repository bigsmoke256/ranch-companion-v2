import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { 
  User, Mail, Phone, MapPin, Shield, Stethoscope, 
  Edit2, Save, X, Calendar, Building
} from 'lucide-react';
import { format } from 'date-fns';

const roleLabels: Record<string, string> = {
  farmer: 'Farmer (Owner)',
  admin: 'Administrator',
  vet: 'Veterinary Doctor',
  farm_manager: 'Farm Manager',
  client: 'Client',
  staff: 'Staff',
};

const roleBadgeColors: Record<string, string> = {
  farmer: 'bg-primary/10 text-primary border-primary/30',
  admin: 'bg-purple-100 text-purple-700 border-purple-200',
  vet: 'bg-green-100 text-green-700 border-green-200',
  farm_manager: 'bg-blue-100 text-blue-700 border-blue-200',
  client: 'bg-gray-100 text-gray-700 border-gray-200',
  staff: 'bg-orange-100 text-orange-700 border-orange-200',
};

function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (updates: {
      full_name?: string;
      phone?: string;
      location?: string;
    }) => {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', user?.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Profile updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update profile');
    },
  });
}

export default function ProfilePage() {
  const { profile, user, role } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [location, setLocation] = useState(profile?.location || '');
  
  const updateProfile = useUpdateProfile();

  const handleSave = async () => {
    await updateProfile.mutateAsync({
      full_name: fullName,
      phone: phone || undefined,
      location: location || undefined,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFullName(profile?.full_name || '');
    setPhone(profile?.phone || '');
    setLocation(profile?.location || '');
    setIsEditing(false);
  };

  const initials = profile?.full_name 
    ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  return (
    <AppLayout>
      <div className="space-y-6 max-w-3xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
          <p className="text-muted-foreground">View and manage your profile information</p>
        </div>

        {/* Profile Card */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20 border-4 border-muted">
                  <AvatarImage src={undefined} alt={profile?.full_name || 'User'} />
                  <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-2xl">{profile?.full_name || 'Your Name'}</CardTitle>
                  <Badge variant="outline" className={`mt-2 ${roleBadgeColors[role || 'client']}`}>
                    {role === 'vet' ? <Stethoscope className="h-3 w-3 mr-1" /> : <User className="h-3 w-3 mr-1" />}
                    {roleLabels[role || 'client']}
                  </Badge>
                </div>
              </div>
              {!isEditing && (
                <Button variant="outline" onClick={() => setIsEditing(true)}>
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Enter your phone number"
                  />
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Enter your location"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <Button onClick={handleSave} disabled={updateProfile.isPending}>
                    <Save className="h-4 w-4 mr-2" />
                    {updateProfile.isPending ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button variant="outline" onClick={handleCancel}>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{user?.email || 'Not provided'}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Phone className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium">{profile?.phone || 'Not provided'}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Location</p>
                    <p className="font-medium">{profile?.location || 'Not provided'}</p>
                  </div>
                </div>

                {role === 'vet' && profile?.license_number && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 border border-green-200">
                    <Shield className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-sm text-green-600">Veterinary License</p>
                      <p className="font-medium text-green-800">{profile.license_number}</p>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Member Since</p>
                    <p className="font-medium">
                      {profile?.created_at 
                        ? format(new Date(profile.created_at), 'MMMM d, yyyy')
                        : 'Unknown'
                      }
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
