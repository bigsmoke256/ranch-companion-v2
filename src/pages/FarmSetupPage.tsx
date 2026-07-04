import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateFarm } from '@/hooks/useFarm';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Building2, MapPin, Phone, Mail, ArrowRight } from 'lucide-react';

const farmSchema = z.object({
  name: z.string().min(2, 'Farm name is required'),
  location: z.string().optional(),
  description: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
});

type FarmFormValues = z.infer<typeof farmSchema>;

export default function FarmSetupPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const createFarm = useCreateFarm();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FarmFormValues>({
    resolver: zodResolver(farmSchema),
    defaultValues: {
      name: '',
      location: '',
      description: '',
      phone: '',
      email: '',
    },
  });

  const onSubmit = async (data: FarmFormValues) => {
    setIsSubmitting(true);
    try {
      await createFarm.mutateAsync({
        name: data.name,
        location: data.location || undefined,
        description: data.description || undefined,
        phone: data.phone || undefined,
        email: data.email || undefined,
      });
      navigate('/');
    } catch (error) {
      console.error('Failed to create farm:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
            <Building2 className="h-6 w-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">Set Up Your Farm</CardTitle>
          <CardDescription>
            Welcome, {profile?.full_name}! Let's create your farm to get started.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Farm Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Green Valley Farm" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Location
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Kampala, Uganda" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Phone
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="+256..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email
                      </FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="farm@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Tell us about your farm..."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="pt-4">
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? 'Creating Farm...' : (
                    <>
                      Create Farm & Continue
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>

              <p className="text-xs text-center text-muted-foreground">
                A unique farm code will be generated automatically.
                You can invite team members after setup.
              </p>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
