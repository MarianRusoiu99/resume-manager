'use client';

import { useState } from 'react';
import { Wrench, Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { AgentSkill, createSkill } from '@/modules/chat-panel/hooks/useSessionManager';

interface SkillsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  generationType: 'resume' | 'cover-letter' | 'template';
  skills: AgentSkill[];
  onAddSkill: (skill: AgentSkill) => void;
  onUpdateSkill: (id: string, updates: Partial<Pick<AgentSkill, 'title' | 'content'>>) => void;
  onDeleteSkill: (id: string) => void;
}

export function SkillsDrawer({
  open,
  onOpenChange,
  skills,
  onAddSkill,
  onUpdateSkill,
  onDeleteSkill,
}: SkillsDrawerProps) {
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');

  function handleAdd() {
    if (!newTitle.trim() || !newContent.trim()) return;
    onAddSkill(createSkill(newTitle.trim(), newContent.trim()));
    setNewTitle('');
    setNewContent('');
  }

  function startEdit(skill: AgentSkill) {
    setEditingId(skill.id);
    setEditTitle(skill.title);
    setEditContent(skill.content);
  }

  function saveEdit(id: string) {
    onUpdateSkill(id, { title: editTitle.trim(), content: editContent.trim() });
    setEditingId(null);
  }

  function cancelEdit() {
    setEditingId(null);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-[480px] flex flex-col gap-0 p-0">
        <SheetHeader className="px-6 pt-6 pb-4">
          <SheetTitle className="flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            Agent Skills
          </SheetTitle>
          <SheetDescription>
            Skills are injected into the AI system prompt to give it extra context about you.
          </SheetDescription>
        </SheetHeader>

        <div className="px-6 pb-4 space-y-3">
          <div className="space-y-2">
            <Label htmlFor="skill-title">Title</Label>
            <Input
              id="skill-title"
              placeholder="e.g. Senior Backend Engineer"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="skill-content">Content</Label>
            <Textarea
              id="skill-content"
              placeholder="I have 8 years of experience in..."
              className="min-h-[80px] resize-none"
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
            />
          </div>
          <Button
            size="sm"
            className="w-full"
            onClick={handleAdd}
            disabled={!newTitle.trim() || !newContent.trim()}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Skill
          </Button>
        </div>

        <Separator />

        <ScrollArea className="flex-1 px-6 py-4">
          {skills.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No skills added yet. Add one above.
            </p>
          ) : (
            <div className="space-y-3">
              {skills.map((skill) =>
                editingId === skill.id ? (
                  <div key={skill.id} className="border rounded-lg p-3 space-y-2">
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      placeholder="Title"
                    />
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      placeholder="Content"
                      className="min-h-[80px] resize-none"
                    />
                    <div className="flex gap-2 justify-end">
                      <Button size="sm" variant="ghost" onClick={cancelEdit}>
                        <X className="h-3 w-3 mr-1" />
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => saveEdit(skill.id)}
                        disabled={!editTitle.trim() || !editContent.trim()}
                      >
                        <Check className="h-3 w-3 mr-1" />
                        Save
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div key={skill.id} className="border rounded-lg p-3 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-sm leading-tight">{skill.title}</p>
                      <div className="flex gap-1 shrink-0">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={() => startEdit(skill)}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 text-destructive hover:text-destructive"
                          onClick={() => onDeleteSkill(skill.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{skill.content}</p>
                  </div>
                )
              )}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
