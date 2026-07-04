import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Beef, Tractor, Stethoscope, Users, ShoppingBag } from 'lucide-react';
import { cn } from '@/lib/utils';

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const signupSchema = z.object({
  fullName: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  licenseNumber: z.string().optional(),
});

// SECURITY: All signups start as 'client' role only
// Privileged roles (farmer, vet, farm_manager) must be requested after signup
// and approved by farm owners through the role request workflow
type Role = 'farmer' | 'vet' | 'farm_manager' | 'client';

interface RoleOption {
  id: Role;
  label: string;
  description: string;
  icon: React.ElementType;
  requiresLicense?: boolean;
}

// Role selection is for user intent only - all signups start as 'client'
// Users must request role upgrade after signup through the proper approval workflow
const roleOptions: RoleOption[] = [
  {
    id: 'farmer',
    label: 'Farmer/Owner',
    description: 'Full farm management access (requires approval)',
    icon: Tractor,
  },
  {
    id: 'vet',
    label: 'Veterinary Doctor',
    description: 'Health records & medical care (requires approval)',
    icon: Stethoscope,
    requiresLicense: true,
  },
  {
    id: 'farm_manager',
    label: 'Farm Manager',
    description: 'Day-to-day operations (requires approval)',
    icon: Users,
  },
  {
    id: 'client',
    label: 'Client',
    description: 'View animals & express interest',
    icon: ShoppingBag,
  },
];

export default function AuthPage() {
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role>('farmer');
  const [googleLoading, setGoogleLoading] = useState(false);

  const signInWithGoogle = async () => {
    setGoogleLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });
    if (error) {
      setError(error.message);
      setGoogleLoading(false);
    }
  };
  useEffect(() => {
    if (user) navigate('/');
  }, [user, navigate]);

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const signupForm = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    defaultValues: { fullName: '', email: '', password: '', licenseNumber: '' },
  });

  const onLogin = async (data: z.infer<typeof loginSchema>) => {
    setLoading(true);
    setError('');
    const { error } = await signIn(data.email, data.password);
    if (error) {
      // Handle specific error for unregistered email
      if (error.message.includes('Invalid login credentials')) {
        setError('No account found with this email or incorrect password. Please sign up first.');
      } else {
        setError(error.message);
      }
    }
    setLoading(false);
  };

  const onSignup = async (data: z.infer<typeof signupSchema>) => {
    setLoading(true);
    setError('');
    
    const selectedRoleOption = roleOptions.find(r => r.id === selectedRole);
    if (selectedRoleOption?.requiresLicense && !data.licenseNumber) {
      setError('License number is required for veterinary doctors');
      setLoading(false);
      return;
    }

    const { error } = await signUp(
      data.email, 
      data.password, 
      data.fullName,
      selectedRole,
      data.licenseNumber
    );
    if (error) setError(error.message);
    setLoading(false);
  };

  const selectedRoleOption = roleOptions.find(r => r.id === selectedRole);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
            <Beef className="h-6 w-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">FarmSync</CardTitle>
          <CardDescription>Livestock Management Suite</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            {error && <p className="text-sm text-destructive mb-4 text-center">{error}</p>}
            
            <TabsContent value="login">
              <div className="space-y-4">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={signInWithGoogle}
                  disabled={googleLoading || loading}
                >
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  {googleLoading ? 'Signing in...' : 'Continue with Google'}
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <Separator className="w-full" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">Or continue with email</span>
                  </div>
                </div>

                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                    <FormField control={loginForm.control} name="email" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl><Input type="email" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={loginForm.control} name="password" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl><Input type="password" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? 'Signing in...' : 'Sign In'}
                    </Button>
                  </form>
                </Form>
              </div>
            </TabsContent>
            
            <TabsContent value="signup">
              <div className="space-y-4">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={signInWithGoogle}
                  disabled={googleLoading || loading}
                >
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  {googleLoading ? 'Signing up...' : 'Continue with Google'}
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <Separator className="w-full" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">Or continue with email</span>
                  </div>
                </div>
              </div>
              <Form {...signupForm}>
                <form onSubmit={signupForm.handleSubmit(onSignup)} className="space-y-4">
                  {/* Role Selection */}
                  <div className="space-y-2">
                    <FormLabel>I am a...</FormLabel>
                    <div className="grid grid-cols-2 gap-2">
                      {roleOptions.map((role) => (
                        <button
                          key={role.id}
                          type="button"
                          onClick={() => setSelectedRole(role.id)}
                          className={cn(
                            "flex flex-col items-center gap-2 rounded-lg border-2 p-3 text-center transition-all hover:border-primary/50",
                            selectedRole === role.id
                              ? "border-primary bg-primary/5"
                              : "border-border"
                          )}
                        >
                          <role.icon className={cn(
                            "h-6 w-6",
                            selectedRole === role.id ? "text-primary" : "text-muted-foreground"
                          )} />
                          <div>
                            <p className={cn(
                              "text-sm font-medium",
                              selectedRole === role.id ? "text-primary" : "text-foreground"
                            )}>
                              {role.label}
                            </p>
                            <p className="text-xs text-muted-foreground">{role.description}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <FormField control={signupForm.control} name="fullName" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={signupForm.control} name="email" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl><Input type="email" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={signupForm.control} name="password" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl><Input type="password" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  
                  {/* License Number for Vets */}
                  {selectedRoleOption?.requiresLicense && (
                    <FormField control={signupForm.control} name="licenseNumber" render={({ field }) => (
                      <FormItem>
                        <FormLabel>License Number *</FormLabel>
                        <FormControl><Input placeholder="VET-XXXXX" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  )}

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Creating account...' : 'Create Account'}
                  </Button>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
