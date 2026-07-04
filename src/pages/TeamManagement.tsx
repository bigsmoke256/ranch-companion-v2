import { useState } from 'react';
import { format } from 'date-fns';
import { useFarms, usePendingRoleRequests, useFarmAssignments, useApproveRoleRequest, useRejectRoleRequest, useRevokeAssignment } from '@/hooks/useFarms';
import { useAuth } from '@/hooks/useAuth';
import { RoleRequest, FarmAssignment, AppRole, Profile } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Users, Clock, Check, X, UserMinus, Shield, Briefcase, Stethoscope, User } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';

const roleIcons: Record<string, typeof User> = {
  farm_manager: Briefcase,
  veterinarian: Stethoscope,
  client: User,
  admin: Shield,
  staff: User,
  farmer: Shield,
};

const roleLabels: Record<string, string> = {
  farm_manager: 'Farm Manager',
  veterinarian: 'Veterinarian',
  client: 'Client',
  admin: 'Admin',
  staff: 'Staff',
  farmer: 'Farmer',
};

const roleBadgeColors: Record<string, string> = {
  farm_manager: 'bg-info/10 text-info border-info/30',
  veterinarian: 'bg-success/10 text-success border-success/30',
  client: 'bg-muted text-muted-foreground border-muted-foreground/30',
  admin: 'bg-primary/10 text-primary border-primary/30',
  staff: 'bg-secondary/10 text-secondary-foreground border-secondary/30',
  farmer: 'bg-primary/10 text-primary border-primary/30',
};

export default function TeamManagement() {
  const { data: farms } = useFarms();
  const { data: pendingRequests, isLoading: loadingRequests } = usePendingRoleRequests();
  const { data: assignments, isLoading: loadingAssignments } = useFarmAssignments();
  const approveRequest = useApproveRoleRequest();
  const rejectRequest = useRejectRoleRequest();
  const revokeAssignment = useRevokeAssignment();
  const { user } = useAuth();

  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<RoleRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);
  const [assignmentToRevoke, setAssignmentToRevoke] = useState<FarmAssignment | null>(null);

  const handleApprove = async (requestId: string) => {
    await approveRequest.mutateAsync(requestId);
  };

  const openRejectDialog = (request: RoleRequest) => {
    setSelectedRequest(request);
    setRejectionReason('');
    setRejectDialogOpen(true);
  };

  const handleReject = async () => {
    if (selectedRequest) {
      await rejectRequest.mutateAsync({
        requestId: selectedRequest.id,
        reason: rejectionReason,
      });
      setRejectDialogOpen(false);
      setSelectedRequest(null);
    }
  };

  const openRevokeDialog = (assignment: FarmAssignment) => {
    setAssignmentToRevoke(assignment);
    setRevokeDialogOpen(true);
  };

  const handleRevoke = async () => {
    if (assignmentToRevoke) {
      await revokeAssignment.mutateAsync(assignmentToRevoke.id);
      setRevokeDialogOpen(false);
      setAssignmentToRevoke(null);
    }
  };

  const getFarmName = (farmId: string) => {
    return farms?.find(f => f.id === farmId)?.name || 'Unknown Farm';
  };

  if (loadingRequests || loadingAssignments) {
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
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team Management</h1>
          <p className="text-muted-foreground">Manage access requests and team members for your farms</p>
        </div>

        <Tabs defaultValue="requests" className="space-y-6">
          <TabsList>
            <TabsTrigger value="requests" className="relative">
              <Clock className="h-4 w-4 mr-2" />
              Pending Requests
              {pendingRequests && pendingRequests.length > 0 && (
                <Badge className="ml-2 h-5 w-5 p-0 flex items-center justify-center" variant="destructive">
                  {pendingRequests.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="team">
              <Users className="h-4 w-4 mr-2" />
              Team Members
            </TabsTrigger>
          </TabsList>

          {/* Pending Requests Tab */}
          <TabsContent value="requests" className="space-y-4">
            {pendingRequests && pendingRequests.length > 0 ? (
              <div className="grid gap-4">
                {pendingRequests.map((request) => {
                  const RoleIcon = roleIcons[request.requested_role] || User;
                  return (
                    <Card key={request.id}>
                      <CardContent className="flex items-center justify-between py-4">
                        <div className="flex items-center gap-4">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                            <RoleIcon className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div>
                            <div className="font-medium">
                              {(request.profiles as Profile | null)?.full_name || 'Unknown User'}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span>Requesting:</span>
                              <Badge variant="outline" className={roleBadgeColors[request.requested_role]}>
                                {roleLabels[request.requested_role] || request.requested_role}
                              </Badge>
                              <span>for</span>
                              <span className="font-medium">{request.farm_id ? getFarmName(request.farm_id) : 'N/A'}</span>
                            </div>
                            {request.license_number && (
                              <div className="text-xs text-muted-foreground mt-1">
                                License: {request.license_number}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground mr-4">
                            {format(new Date(request.created_at), 'MMM d, yyyy')}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openRejectDialog(request)}
                            disabled={rejectRequest.isPending}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleApprove(request.id)}
                            disabled={approveRequest.isPending}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Clock className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No pending requests</h3>
                  <p className="text-muted-foreground text-center">
                    New access requests from farm managers and veterinarians will appear here
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Team Members Tab */}
          <TabsContent value="team" className="space-y-4">
            {assignments && assignments.length > 0 ? (
              <div className="grid gap-4">
                {assignments.map((assignment) => {
                  const RoleIcon = roleIcons[assignment.role] || User;
                  return (
                    <Card key={assignment.id}>
                      <CardContent className="flex items-center justify-between py-4">
                        <div className="flex items-center gap-4">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                            <RoleIcon className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div>
                            <div className="font-medium">
                              {(assignment.profiles as Profile | null)?.full_name || 'Unknown User'}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Badge variant="outline" className={roleBadgeColors[assignment.role]}>
                                {roleLabels[assignment.role] || assignment.role}
                              </Badge>
                              <span>at</span>
                              <span className="font-medium">{getFarmName(assignment.farm_id)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground mr-4">
                            Joined {format(new Date(assignment.created_at), 'MMM d, yyyy')}
                          </span>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => openRevokeDialog(assignment)}
                          >
                            <UserMinus className="h-4 w-4 mr-1" />
                            Revoke Access
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No team members yet</h3>
                  <p className="text-muted-foreground text-center">
                    Approved farm managers and veterinarians will appear here
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Request</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting this access request.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="reason">Rejection Reason</Label>
              <Textarea
                id="reason"
                placeholder="Enter the reason for rejection..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="mt-1.5"
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={rejectRequest.isPending}
              >
                {rejectRequest.isPending ? 'Rejecting...' : 'Reject Request'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Revoke Confirmation */}
      <AlertDialog open={revokeDialogOpen} onOpenChange={setRevokeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke Access</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to revoke access for{' '}
              <strong>{(assignmentToRevoke?.profiles as Profile | null)?.full_name}</strong>? They will no
              longer be able to access the farm.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevoke}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Revoke Access
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
