"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FilePlus, PenTool, Layout, UserCog, Zap } from "lucide-react";
import Link from "next/link";

export function QuickActions() {
  const actions = [
    {
      title: "New Resume",
      description: "Generate a tailored resume",
      icon: FilePlus,
      href: "/generate",
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      title: "Cover Letter",
      description: "Write a matching cover letter",
      icon: PenTool,
      href: "/generate?type=cover-letter",
      color: "text-purple-500",
      bg: "bg-purple-500/10",
    },
    {
      title: "Templates",
      description: "Browse premium designs",
      icon: Layout,
      href: "/templates",
      color: "text-orange-500",
      bg: "bg-orange-500/10",
    },
    {
      title: "My Profile",
      description: "Update your career details",
      icon: UserCog,
      href: "/profiles",
      color: "text-green-500",
      bg: "bg-green-500/10",
    },
  ];

  return (
    <Card className="rounded-xl shadow-sm overflow-hidden border-none bg-card/50 backdrop-blur-sm h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6">
        <div className="space-y-1">
          <CardTitle className="text-sm font-bold uppercase tracking-widest text-primary">Quick Actions</CardTitle>
          <CardDescription className="text-[10px] uppercase tracking-wider">Commonly used tools</CardDescription>
        </div>
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Zap className="h-4 w-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent className="grid gap-3">
        {actions.map((action) => (
          <Button
            key={action.title}
            variant="ghost"
            asChild
            className="w-full justify-start h-auto p-3 hover:bg-primary/5 rounded-xl border border-transparent hover:border-primary/5 transition-all active:scale-[0.98] group"
          >
            <Link href={action.href} className="flex items-center gap-4">
              <div className={`p-2 rounded-lg ${action.bg} ${action.color} group-hover:scale-110 transition-transform`}>
                <action.icon className="h-4 w-4" />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold uppercase tracking-tight">{action.title}</p>
                <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mt-0.5">
                  {action.description}
                </p>
              </div>
            </Link>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}
