import { Link } from 'react-router-dom';
import { Livestock } from '@/types/database';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useDeleteLivestock } from '@/hooks/useLivestock';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface LivestockTableProps {
  livestock: Livestock[];
  isLoading?: boolean;
}

const statusStyles: Record<string, string> = {
  active: 'status-active',
  sold: 'status-sold',
  deceased: 'status-deceased',
  transferred: 'status-transferred',
};

export function LivestockTable({ livestock, isLoading }: LivestockTableProps) {
  const { isAdmin } = useAuth();
  const deleteLivestock = useDeleteLivestock();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (livestock.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-lg font-medium">No animals found</p>
        <p className="text-sm text-muted-foreground mt-1">
          Add your first animal to get started
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Animal ID</TableHead>
            <TableHead>Breed</TableHead>
            <TableHead>Age</TableHead>
            <TableHead>Sex</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date Added</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {livestock.map((animal) => (
            <TableRow key={animal.id} className="table-row-hover">
              <TableCell className="font-medium">{animal.animal_id}</TableCell>
              <TableCell>{animal.breed}</TableCell>
              <TableCell>{animal.age} yrs</TableCell>
              <TableCell className="capitalize">{animal.sex}</TableCell>
              <TableCell>
                <Badge 
                  variant="outline" 
                  className={cn("capitalize", statusStyles[animal.status])}
                >
                  {animal.status}
                </Badge>
              </TableCell>
              <TableCell>
                {format(new Date(animal.created_at), 'MMM d, yyyy')}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <Button variant="ghost" size="icon" asChild>
                    <Link to={`/livestock/${animal.id}`}>
                      <Eye className="h-4 w-4" />
                    </Link>
                  </Button>
                  {isAdmin && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Animal</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete {animal.animal_id}? This action cannot be undone and will remove all associated records.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteLivestock.mutate(animal.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
