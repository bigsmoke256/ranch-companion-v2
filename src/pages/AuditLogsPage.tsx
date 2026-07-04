import { format } from 'date-fns';
import { useAuditLogs, useFarms } from '@/hooks/useFarms';
import { AuditLog } from '@/types/database';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  FileText, 
  Plus, 
  Pencil, 
  Trash2, 
  UserPlus, 
  UserMinus, 
  Check, 
  X,
  Activity 
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useState } from 'react';

const actionIcons: Record<string, typeof Activity> = {
  create: Plus,
  update: Pencil,
  delete: Trash2,
  approve: Check,
  reject: X,
  assign: UserPlus,
  revoke: UserMinus,
};

const actionColors: Record<string, string> = {
  create: 'bg-success/10 text-success border-success/30',
  update: 'bg-info/10 text-info border-info/30',
  delete: 'bg-destructive/10 text-destructive border-destructive/30',
  approve: 'bg-success/10 text-success border-success/30',
  reject: 'bg-destructive/10 text-destructive border-destructive/30',
  assign: 'bg-primary/10 text-primary border-primary/30',
  revoke: 'bg-warning/10 text-warning border-warning/30',
};

export default function AuditLogsPage() {
  const { data: farms } = useFarms();
  const [selectedFarm, setSelectedFarm] = useState<string>('all');
  const { data: logs, isLoading } = useAuditLogs(selectedFarm === 'all' ? undefined : selectedFarm);

  const getActionIcon = (action: string) => {
    const actionType = action.toLowerCase().split('_')[0];
    return actionIcons[actionType] || Activity;
  };

  const getActionColor = (action: string) => {
    const actionType = action.toLowerCase().split('_')[0];
    return actionColors[actionType] || 'bg-muted text-muted-foreground border-muted-foreground/30';
  };

  const getFarmName = (farmId: string | null) => {
    if (!farmId) return 'System';
    return farms?.find(f => f.id === farmId)?.name || 'Unknown Farm';
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
            <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
            <p className="text-muted-foreground">Track all activities across your farms</p>
          </div>
          <Select value={selectedFarm} onValueChange={setSelectedFarm}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by farm" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Farms</SelectItem>
              {farms?.map((farm) => (
                <SelectItem key={farm.id} value={farm.id}>
                  {farm.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Logs List */}
        {logs && logs.length > 0 ? (
          <div className="space-y-4">
            {logs.map((log) => {
              const ActionIcon = getActionIcon(log.action);
              return (
                <Card key={log.id}>
                  <CardContent className="flex items-start gap-4 py-4">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${getActionColor(log.action).split(' ')[0]}`}>
                      <ActionIcon className={`h-5 w-5 ${getActionColor(log.action).split(' ')[1]}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className={getActionColor(log.action)}>
                          {log.action.replace(/_/g, ' ')}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          on {log.entity_type}
                        </span>
                      </div>
                      {log.details && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {typeof log.details === 'string' 
                            ? log.details 
                            : JSON.stringify(log.details)}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span>{getFarmName(log.farm_id)}</span>
                        <span>•</span>
                        <span>{format(new Date(log.created_at), 'MMM d, yyyy h:mm a')}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No audit logs yet</h3>
              <p className="text-muted-foreground text-center">
                Activities will be logged as you and your team use the platform
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
