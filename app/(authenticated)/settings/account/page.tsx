'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Page } from '@/components/layout/Page';
import { Button, Card, Alert, AlertDescription, AlertTitle } from '@/components/ui';
import { deleteAccountAction } from '@/app/actions/auth';
import { AlertTriangle, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function AccountSettingsPage() {
  const router = useRouter();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState('');

  const handleDeleteAccount = async () => {
    try {
      setIsDeleting(true);
      const result = await deleteAccountAction();

      if (result?.success) {
        toast.success('Your account has been permanently deleted.');
        router.push('/login');
      } else {
        toast.error(result?.message || 'Failed to delete account');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  return (
    <Page
      title="Account Settings"
      description="Manage your account preferences and security"
      breadcrumbs={[
        { label: 'Settings', href: '/settings' },
        { label: 'Account' },
      ]}
    >
      <div className="space-y-6">
        <Card className="p-6 border-destructive/20">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-destructive/10">
              <Trash2 className="h-6 w-6 text-destructive" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-destructive mb-1">
                Delete Account
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Permanently delete your account and all associated data, including resumes, 
                cover letters, and API keys. This action cannot be undone.
              </p>
              
              <Alert variant="destructive" className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Warning</AlertTitle>
                <AlertDescription>
                  Deleting your account will remove all your data from our servers. 
                  You will not be able to recover your resumes or settings.
                </AlertDescription>
              </Alert>

              <Button 
                variant="destructive" 
                onClick={() => setShowDeleteDialog(true)}
              >
                Delete My Account
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you absolutely sure?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete your
              account and remove all your data from our servers.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm font-medium mb-2">
              Type <span className="font-bold select-all">DELETE</span> to confirm
            </p>
            <input
              type="text"
              className="w-full px-3 py-2 border rounded-md"
              placeholder="DELETE"
              value={confirmEmail}
              onChange={(e) => setConfirmEmail(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={isDeleting || confirmEmail !== 'DELETE'}
            >
              {isDeleting ? 'Deleting...' : 'Permanently Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Page>
  );
}
