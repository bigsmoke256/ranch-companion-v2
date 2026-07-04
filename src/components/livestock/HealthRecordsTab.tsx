import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { HealthRecord } from '@/types/database';
import { 
  useHealthRecords, 
  useCreateHealthRecord, 
  useUpdateHealthRecord,
  useDeleteHealthRecord 
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
import { Plus, Pencil, Trash2, Syringe, Stethoscope, Pill, AlertCircle, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

const recordTypeIcons: Record<string, typeof Syringe> = {
  vaccination: Syringe,
  checkup: Stethoscope,
  treatment: Pill,
  illness: AlertCircle,
  diagnosis: Stethoscope,
  follow_up: FileText,
  other: FileText,
};

const recordTypeColors: Record<string, string> = {
  vaccination: 'bg-info/10 text-info border-info/30',
  checkup: 'bg-success/10 text-success border-success/30',
  treatment: 'bg-warning/10 text-warning border-warning/30',
  illness: 'bg-destructive/10 text-destructive border-destructive/30',
  diagnosis: 'bg-primary/10 text-primary border-primary/30',
  follow_up: 'bg-accent/10 text-accent-foreground border-accent/30',
  other: 'bg-muted text-muted-foreground border-muted-foreground/30',
};

const formSchema = z.object({
  record_type: z.enum(['vaccination', 'treatment', 'checkup', 'illness', 'diagnosis', 'follow_up', 'other']),
  description: z.string().min(1, 'Description is required').max(500),
  performed_by: z.string().max(100).optional(),
  record_date: z.string().min(1, 'Date is required'),
});

type FormValues = z.infer<typeof formSchema>;

interface HealthRecordsTabProps {
  livestockId: string;
}

export function HealthRecordsTab({ livestockId }: HealthRecordsTabProps) {
  const { data: records, isLoading } = useHealthRecords(livestockId);
  const createRecord = useCreateHealthRecord();
  const updateRecord = useUpdateHealthRecord();
  const deleteRecord = useDeleteHealthRecord();
  const { isAdmin } = useAuth();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<HealthRecord | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      record_type: 'checkup',
      description: '',
      performed_by: '',
      record_date: new Date().toISOString().split('T')[0],
    },
  });

  const openEditDialog = (record: HealthRecord) => {
    setEditingRecord(record);
    const validTypes = ['vaccination', 'treatment', 'checkup', 'illness', 'diagnosis', 'follow_up', 'other'] as const;
    const recordType = validTypes.includes(record.record_type as typeof validTypes[number]) 
      ? record.record_type as typeof validTypes[number]
      : 'other';
    form.reset({
      record_type: recordType,
      description: record.description,
      performed_by: record.performed_by || '',
      record_date: record.record_date,
    });
    setDialogOpen(true);
  };

  const openNewDialog = () => {
    setEditingRecord(null);
    form.reset({
      record_type: 'checkup',
      description: '',
      performed_by: '',
      record_date: new Date().toISOString().split('T')[0],
    });
    setDialogOpen(true);
  };

  const onSubmit = async (data: FormValues) => {
    if (editingRecord) {
      await updateRecord.mutateAsync({
        id: editingRecord.id,
        ...data,
        performed_by: data.performed_by || null,
      });
    } else {
      await createRecord.mutateAsync({
        livestock_id: livestockId,
        record_type: data.record_type,
        description: data.description,
        performed_by: data.performed_by || null,
        record_date: data.record_date,
      });
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
        <h3 className="font-semibold">Health Records</h3>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={openNewDialog}>
              <Plus className="h-4 w-4 mr-1" /> Add Record
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingRecord ? 'Edit' : 'Add'} Health Record</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="record_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="vaccination">Vaccination</SelectItem>
                          <SelectItem value="checkup">Checkup</SelectItem>
                          <SelectItem value="treatment">Treatment</SelectItem>
                          <SelectItem value="illness">Illness</SelectItem>
                          <SelectItem value="diagnosis">Diagnosis</SelectItem>
                          <SelectItem value="follow_up">Follow-up</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="record_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
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
                        <Textarea {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="performed_by"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Performed By</FormLabel>
                      <FormControl>
                        <Input placeholder="Veterinarian name" {...field} />
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
        <p className="text-center text-muted-foreground py-8">No health records yet</p>
      ) : (
        <div className="space-y-3">
          {records?.map((record) => {
            const Icon = recordTypeIcons[record.record_type];
            return (
              <Card key={record.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={cn("p-2 rounded-lg", recordTypeColors[record.record_type])}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={cn("capitalize", recordTypeColors[record.record_type])}>
                            {record.record_type}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(record.record_date), 'MMM d, yyyy')}
                          </span>
                        </div>
                        <p className="mt-1 text-sm">{record.description}</p>
                        {record.performed_by && (
                          <p className="text-xs text-muted-foreground mt-1">By: {record.performed_by}</p>
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
            );
          })}
        </div>
      )}
    </div>
  );
}
