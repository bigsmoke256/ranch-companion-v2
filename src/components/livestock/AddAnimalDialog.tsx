import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus } from 'lucide-react';
import { useCreateLivestock } from '@/hooks/useLivestock';

const formSchema = z.object({
  animal_id: z.string().min(1, 'Animal ID is required').max(50, 'Animal ID too long'),
  breed: z.string().min(1, 'Breed is required').max(100, 'Breed name too long'),
  age: z.coerce.number().min(0, 'Age must be positive').max(50, 'Invalid age'),
  sex: z.enum(['male', 'female'], { required_error: 'Sex is required' }),
  notes: z.string().max(500, 'Notes too long').optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface AddAnimalDialogProps {
  trigger?: React.ReactNode;
}

export function AddAnimalDialog({ trigger }: AddAnimalDialogProps) {
  const [open, setOpen] = useState(false);
  const createLivestock = useCreateLivestock();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      animal_id: '',
      breed: '',
      age: 0,
      notes: '',
    },
  });

  const onSubmit = async (data: FormValues) => {
    await createLivestock.mutateAsync({
      animal_id: data.animal_id,
      breed: data.breed,
      age: data.age,
      sex: data.sex,
      status: 'active',
      notes: data.notes || null,
    });
    form.reset();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Animal
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Add New Animal</DialogTitle>
          <DialogDescription>
            Enter the details for the new animal. All fields marked with * are required.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="animal_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Animal ID *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., TAG-001" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="breed"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Breed *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Angus" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="age"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Age (years) *</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="sex"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sex *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select sex" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Additional notes about this animal..."
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
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createLivestock.isPending}
              >
                {createLivestock.isPending ? 'Adding...' : 'Add Animal'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
