import { AppLayout } from '@/components/layout/AppLayout';
import { useLivestockList } from '@/hooks/useLivestock';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download } from 'lucide-react';
import { useState } from 'react';
import { format } from 'date-fns';

export default function Reports() {
  const { data: livestock, isLoading } = useLivestockList();
  const [breedFilter, setBreedFilter] = useState<string>('all');
  const [sexFilter, setSexFilter] = useState<string>('all');

  const breeds = [...new Set(livestock?.map(l => l.breed) ?? [])];

  const filtered = livestock?.filter(animal => {
    if (breedFilter !== 'all' && animal.breed !== breedFilter) return false;
    if (sexFilter !== 'all' && animal.sex !== sexFilter) return false;
    return true;
  }) ?? [];

  const exportCSV = () => {
    const headers = ['Animal ID', 'Breed', 'Age', 'Sex', 'Status', 'Date Added'];
    const rows = filtered.map(a => [a.animal_id, a.breed, a.age, a.sex, a.status, format(new Date(a.created_at), 'yyyy-MM-dd')]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `livestock-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
            <p className="text-muted-foreground">Generate and export livestock reports</p>
          </div>
          <Button onClick={exportCSV} disabled={filtered.length === 0}><Download className="h-4 w-4 mr-2" />Export CSV</Button>
        </div>

        <Card>
          <CardHeader><CardTitle>Filters</CardTitle></CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Select value={breedFilter} onValueChange={setBreedFilter}>
                <SelectTrigger className="w-48"><SelectValue placeholder="All Breeds" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Breeds</SelectItem>
                  {breeds.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={sexFilter} onValueChange={setSexFilter}>
                <SelectTrigger className="w-48"><SelectValue placeholder="All Sexes" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sexes</SelectItem>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Results ({filtered.length} animals)</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8"><div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Animal ID</TableHead><TableHead>Breed</TableHead><TableHead>Age</TableHead><TableHead>Sex</TableHead><TableHead>Status</TableHead><TableHead>Date Added</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(a => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">{a.animal_id}</TableCell>
                      <TableCell>{a.breed}</TableCell>
                      <TableCell>{a.age} yrs</TableCell>
                      <TableCell className="capitalize">{a.sex}</TableCell>
                      <TableCell className="capitalize">{a.status}</TableCell>
                      <TableCell>{format(new Date(a.created_at), 'MMM d, yyyy')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
