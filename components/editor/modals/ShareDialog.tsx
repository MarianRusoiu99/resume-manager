import { Copy } from "lucide-react";
import { Button, Input } from "@/components/ui";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  displayName: string;
  isPublic: boolean;
  publicLink: string | null;
  onTogglePublic: () => Promise<void>;
  onCopyLink: () => void;
  canTogglePublic: boolean;
}

export function ShareDialog({
  open,
  onOpenChange,
  displayName,
  isPublic,
  publicLink,
  onTogglePublic,
  onCopyLink,
  canTogglePublic,
}: ShareDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share Your {displayName || "Resume"}</DialogTitle>
          <DialogDescription>
            Make your resume public and share it with a custom link
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Public Access</p>
              <p className="text-sm text-muted-foreground">
                {isPublic ? "Your resume is publicly accessible" : "Your resume is private"}
              </p>
            </div>
            <Button
              variant={isPublic ? "destructive" : "default"}
              onClick={onTogglePublic}
              disabled={!canTogglePublic}
            >
              {isPublic ? "Make Private" : "Make Public"}
            </Button>
          </div>

          {isPublic && publicLink && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Public Link:</p>
              <div className="flex gap-2">
                <Input
                  value={publicLink}
                  readOnly
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={onCopyLink}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Anyone with this link can view your resume
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
