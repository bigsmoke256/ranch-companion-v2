import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { MovementRecord } from '@/types/database';
import { 
  useMovementRecords, 
  useCreateMovementRecord, 
  useUpdateMovementRecord,
  useDeleteMovementRecord 
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
import { Plus, Pencil, Trash2, Truck, ArrowRight } from 'lucide-react';

const formSchema = z.object({
  from_location: z.string().min(1, 'From location is required').max(100),
  to_location: z.string().min(1, 'To location is required').max(100),
  movement_date: z.string().min(1, 'Date is required'),
  reason: z.string().max(200).optional(),
  transported_by: z.string().max(100).optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface MovementRecordsTabProps {
  livestockId: string;
}

export function MovementRecordsTab({ livestockId }: MovementRecordsTabProps) {
  const { data: records, isLoading } = useMovementRecords(livestockId);
  const createRecord = useCreateMovementRecord();
  const updateRecord = useUpdateMovementRecord();
  const deleteRecord = useDeleteMovementRecord();
  const { isAdmin } = useAuth();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<MovementRecord | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      from_location: '',
      to_location: '',
      movement_date: new Date().toISOString().split('T')[0],
      reason: '',
      transported_by: '',
    },
  });

  const openEditDialog = (record: MovementRecord) => {
    setEditingRecord(record);
    form.reset({
      from_location: record.from_location,
      to_location: record.to_location,
      movement_date: record.movement_date,
      reason: record.reason || '',
      transported_by: record.transported_by || '',
    });
    setDialogOpen(true);
  };

  const openNewDialog = () => {
    setEditingRecord(null);
    form.reset({
      from_location: '',
      to_location: '',
      movement_date: new Date().toISOString().split('T')[0],
      reason: '',
      transported_by: '',
    });
    setDialogOpen(true);
  };

  const onSubmit = async (data: FormValues) => {
    const payload = {
      from_location: data.from_location,
      to_location: data.to_location,
      movement_date: data.movement_date,
      reason: data.reason || null,
      transported_by: data.transported_by || null,
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
        <h3 className="font-semibold">Movement History</h3>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={openNewDialog}>
              <Plus className="h-4 w-4 mr-1" /> Add Record
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingRecord ? 'Edit' : 'Add'} Movement Record</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="movement_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="from_location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>From Location *</FormLabel>
                        <FormControl>
                          <Input placeholder="Pasture A" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="to_location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>To Location *</FormLabel>
                        <FormControl>
                          <Input placeholder="Barn B" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reason</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Seasonal rotation" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="transported_by"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Transported By</FormLabel>
                      <FormControl>
                        <Input placeholder="Staff name" {...field} />
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
        <p className="text-center text-muted-foreground py-8">No movement records yet</p>
      ) : (
        <div className="space-y-3">
          {records?.map((record) => (
            <Card key={record.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-accent/10 text-accent-foreground">
                      <Truck className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <span>{record.from_location}</span>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        <span>{record.to_location}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {format(new Date(record.movement_date), 'MMM d, yyyy')}
                      </p>
                      {record.reason && <p className="text-sm mt-1">{record.reason}</p>}
                      {record.transported_by && (
                        <p className="text-xs text-muted-foreground mt-1">By: {record.transported_by}</p>
                      )}
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
