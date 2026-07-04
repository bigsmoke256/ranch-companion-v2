import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { useFarms, useCreateFarm, useUpdateFarm, useDeleteFarm } from '@/hooks/useFarms';
import { useAuth } from '@/hooks/useAuth';
import { Farm } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, MapPin, Calendar, Pencil, Trash2, Building2 } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';

const formSchema = z.object({
  name: z.string().min(2, 'Farm name is required').max(100, 'Name too long'),
  location: z.string().max(200, 'Location too long').optional(),
  description: z.string().max(500, 'Description too long').optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function FarmsPage() {
  const { data: farms, isLoading } = useFarms();
  const createFarm = useCreateFarm();
  const updateFarm = useUpdateFarm();
  const deleteFarm = useDeleteFarm();
  const { user } = useAuth();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFarm, setEditingFarm] = useState<Farm | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [farmToDelete, setFarmToDelete] = useState<Farm | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      location: '',
      description: '',
    },
  });

  const openEditDialog = (farm: Farm) => {
    setEditingFarm(farm);
    form.reset({
      name: farm.name,
      location: farm.location || '',
      description: farm.description || '',
    });
    setDialogOpen(true);
  };

  const openNewDialog = () => {
    setEditingFarm(null);
    form.reset({
      name: '',
      location: '',
      description: '',
    });
    setDialogOpen(true);
  };

  const onSubmit = async (data: FormValues) => {
    if (editingFarm) {
      await updateFarm.mutateAsync({
        id: editingFarm.id,
        name: data.name,
        location: data.location || null,
        description: data.description || null,
      });
    } else {
      await createFarm.mutateAsync({
        name: data.name,
        location: data.location,
        description: data.description,
      });
    }
    setDialogOpen(false);
    form.reset();
  };

  const handleDelete = async () => {
    if (farmToDelete) {
      await deleteFarm.mutateAsync(farmToDelete.id);
      setDeleteConfirmOpen(false);
      setFarmToDelete(null);
    }
  };

  const confirmDelete = (farm: Farm) => {
    setFarmToDelete(farm);
    setDeleteConfirmOpen(true);
  };

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
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Farms</h1>
            <p className="text-muted-foreground">Manage your farms and their details</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openNewDialog}>
                <Plus className="mr-2 h-4 w-4" />
                Add Farm
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>{editingFarm ? 'Edit Farm' : 'Add New Farm'}</DialogTitle>
                <DialogDescription>
                  {editingFarm 
                    ? 'Update the details for this farm.'
                    : 'Enter the details for your new farm.'}
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Farm Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Green Valley Ranch" {...field} />
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
                        <FormLabel>Location</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Kampala, Uganda" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Brief description of the farm..."
                            className="resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={createFarm.isPending || updateFarm.isPending}
                    >
                      {createFarm.isPending || updateFarm.isPending
                        ? 'Saving...'
                        : editingFarm
                        ? 'Update Farm'
                        : 'Create Farm'}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Farms Grid */}
        {farms && farms.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {farms.map((farm) => (
              <Card key={farm.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{farm.name}</CardTitle>
                        {farm.location && (
                          <div className="flex items-center text-sm text-muted-foreground mt-1">
                            <MapPin className="h-3 w-3 mr-1" />
                            {farm.location}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(farm)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => confirmDelete(farm)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {farm.description && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {farm.description}
                    </p>
                  )}
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3 mr-1" />
                    Created {format(new Date(farm.created_at), 'MMM d, yyyy')}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Building2 className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No farms yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                Create your first farm to start managing your livestock
              </p>
              <Button onClick={openNewDialog}>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Farm
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Farm</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{farmToDelete?.name}"? This action cannot
              be undone and will remove all associated livestock and records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Farm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
