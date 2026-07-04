import { format } from 'date-fns';
import { useMyInterests } from '@/hooks/useClientData';
import { AppLayout } from '@/components/layout/AppLayout';
import type { Livestock } from '@/types/database';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { 
  Heart, Clock, CheckCircle, XCircle, Eye, MessageSquare, Calendar
} from 'lucide-react';

const statusConfig: Record<string, { icon: typeof Clock; color: string; label: string }> = {
  pending: { icon: Clock, color: 'bg-yellow-100 text-yellow-700 border-yellow-200', label: 'Pending' },
  contacted: { icon: CheckCircle, color: 'bg-green-100 text-green-700 border-green-200', label: 'Contacted' },
  declined: { icon: XCircle, color: 'bg-red-100 text-red-700 border-red-200', label: 'Declined' },
};

export default function MyInterestsPage() {
  const { data: interests, isLoading } = useMyInterests();

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </AppLayout>
    );
  }

  const pendingCount = interests?.filter(i => i.status === 'pending').length || 0;
  const contactedCount = interests?.filter(i => i.status === 'contacted').length || 0;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Interests</h1>
          <p className="text-muted-foreground">Animals you've expressed interest in</p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Heart className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{interests?.length || 0}</p>
                  <p className="text-sm text-muted-foreground">Total Interests</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-100">
                  <Clock className="h-5 w-5 text-yellow-700" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{pendingCount}</p>
                  <p className="text-sm text-muted-foreground">Awaiting Response</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100">
                  <CheckCircle className="h-5 w-5 text-green-700" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{contactedCount}</p>
                  <p className="text-sm text-muted-foreground">Contacted by Farmer</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Interests List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5" />
              Your Interest History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {interests && interests.length > 0 ? (
              <div className="space-y-4">
                {interests.map((interest) => {
                  const animal = interest.livestock as Livestock | null;
                  const config = statusConfig[interest.status] || statusConfig.pending;
                  const StatusIcon = config.icon;
                  
                  return (
                    <div key={interest.id} className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Heart className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-semibold text-lg">{animal?.animal_id || 'Unknown'}</span>
                          <Badge variant="outline" className={config.color}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {config.label}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm mb-3">
                          <div>
                            <span className="text-muted-foreground">Breed:</span>{' '}
                            <span className="font-medium">{animal?.breed || '-'}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Age:</span>{' '}
                            <span className="font-medium">{animal?.age || '-'} years</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Sex:</span>{' '}
                            <span className="font-medium capitalize">{animal?.sex || '-'}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Status:</span>{' '}
                            <span className="font-medium capitalize">{animal?.status || '-'}</span>
                          </div>
                        </div>
                        
                        {interest.message && (
                          <div className="flex items-start gap-2 text-sm bg-muted/50 p-2 rounded">
                            <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <p className="text-muted-foreground">{interest.message}</p>
                          </div>
                        )}
                      </div>
                      <div className="text-right shrink-0 space-y-2">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(interest.created_at), 'MMM d, yyyy')}
                        </div>
                        <Link to={`/browse/${animal?.id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <Heart className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No interests yet</h3>
                <p className="text-muted-foreground mb-4">
                  Browse available animals and express your interest
                </p>
                <Link to="/browse">
                  <Button>
                    <Eye className="h-4 w-4 mr-2" />
                    Browse Animals
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
