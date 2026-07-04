import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { BreedingRecord, BreedingOutcome } from '@/types/database';
import { 
  useBreedingRecords, 
  useCreateBreedingRecord, 
  useUpdateBreedingRecord,
  useDeleteBreedingRecord 
} from '@/hooks/useLivestock';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, GitBranch } from 'lucide-react';
import { cn } from '@/lib/utils';

const outcomeColors: Record<BreedingOutcome, string> = {
  pending: 'bg-warning/10 text-warning border-warning/30',
  successful: 'bg-success/10 text-success border-success/30',
  unsuccessful: 'bg-muted text-muted-foreground border-muted-foreground/30',
  complications: 'bg-destructive/10 text-destructive border-destructive/30',
};

const formSchema = z.object({
  partner_animal_id: z.string().max(50).optional(),
  breeding_date: z.string().min(1, 'Breeding date is required'),
  expected_due_date: z.string().optional(),
  actual_birth_date: z.string().optional(),
  offspring_count: z.coerce.number().min(0).optional(),
  outcome: z.enum(['pending', 'successful', 'unsuccessful', 'complications']).optional(),
  notes: z.string().max(500).optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface BreedingRecordsTabProps {
  livestockId: string;
}

export function BreedingRecordsTab({ livestockId }: BreedingRecordsTabProps) {
  const { data: records, isLoading } = useBreedingRecords(livestockId);
  const createRecord = useCreateBreedingRecord();
  const updateRecord = useUpdateBreedingRecord();
  const deleteRecord = useDeleteBreedingRecord();
  const { isAdmin } = useAuth();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<BreedingRecord | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      partner_animal_id: '',
      breeding_date: new Date().toISOString().split('T')[0],
      expected_due_date: '',
      actual_birth_date: '',
      offspring_count: undefined,
      outcome: 'pending',
      notes: '',
    },
  });

  const openEditDialog = (record: BreedingRecord) => {
    setEditingRecord(record);
    form.reset({
      partner_animal_id: record.partner_animal_id || '',
      breeding_date: record.breeding_date,
      expected_due_date: record.expected_due_date || '',
      actual_birth_date: record.actual_birth_date || '',
      offspring_count: record.offspring_count ?? undefined,
      outcome: (record.outcome as 'pending' | 'successful' | 'unsuccessful' | 'complications') || 'pending',
      notes: record.notes || '',
    });
    setDialogOpen(true);
  };

  const openNewDialog = () => {
    setEditingRecord(null);
    form.reset({
      partner_animal_id: '',
      breeding_date: new Date().toISOString().split('T')[0],
      expected_due_date: '',
      actual_birth_date: '',
      offspring_count: undefined,
      outcome: 'pending',
      notes: '',
    });
    setDialogOpen(true);
  };

  const onSubmit = async (data: FormValues) => {
    const payload = {
      partner_animal_id: data.partner_animal_id || null,
      breeding_date: data.breeding_date,
      expected_due_date: data.expected_due_date || null,
      actual_birth_date: data.actual_birth_date || null,
      offspring_count: data.offspring_count ?? null,
      outcome: data.outcome || null,
      notes: data.notes || null,
    };

    if (editingRecord) {
      await updateRecord.mutateAsync({ id: editingRecord.id, ...payload });
    } else {
      await createRecord.mutateAsync({ livestock_id: livestockId, ...payload });
    }
    setDialogOpen(false);
    form.reset();
  };

  if (isLoading) {
    return <div className="flex justify-center py-8"><div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">Breeding Records</h3>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={openNewDialog}>
              <Plus className="h-4 w-4 mr-1" /> Add Record
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingRecord ? 'Edit' : 'Add'} Breeding Record</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="breeding_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Breeding Date *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="partner_animal_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Partner ID</FormLabel>
                        <FormControl>
                          <Input placeholder="TAG-002" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="expected_due_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Expected Due Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="actual_birth_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Actual Birth Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="offspring_count"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Offspring Count</FormLabel>
                        <FormControl>
                          <Input type="number" min={0} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="outcome"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Outcome</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="successful">Successful</SelectItem>
                            <SelectItem value="unsuccessful">Unsuccessful</SelectItem>
                            <SelectItem value="complications">Complications</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={createRecord.isPending || updateRecord.isPending}>
                    {editingRecord ? 'Update' : 'Add'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {records?.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">No breeding records yet</p>
      ) : (
        <div className="space-y-3">
          {records?.map((record) => (
            <Card key={record.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-info/10 text-info">
                      <GitBranch className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {format(new Date(record.breeding_date), 'MMM d, yyyy')}
                        </span>
                        {record.outcome && (
                          <Badge variant="outline" className={cn("capitalize", outcomeColors[record.outcome])}>
                            {record.outcome}
                          </Badge>
                        )}
                      </div>
                      <div className="mt-1 text-sm text-muted-foreground space-y-0.5">
                        {record.partner_animal_id && <p>Partner: {record.partner_animal_id}</p>}
                        {record.expected_due_date && <p>Expected: {format(new Date(record.expected_due_date), 'MMM d, yyyy')}</p>}
                        {record.offspring_count != null && <p>Offspring: {record.offspring_count}</p>}
                        {record.notes && <p className="text-foreground mt-1">{record.notes}</p>}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(record)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    {isAdmin && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-destructive"
                        onClick={() => deleteRecord.mutate({ id: record.id, livestockId })}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
