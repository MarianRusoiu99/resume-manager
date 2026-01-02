'use client';

import Link from 'next/link';
import { Page } from '@/components/layout/Page';
import { Card } from '@/components/ui';
import { Key, Cpu, ChevronRight, User } from 'lucide-react';

const settingsPages = [
  {
    title: 'API Keys',
    description: 'Manage your AI provider API keys securely',
    href: '/settings/api-keys',
    icon: Key,
  },
  {
    title: 'AI Models',
    description: 'Configure which AI models to use for each feature',
    href: '/settings/ai-models',
    icon: Cpu,
  },
  {
    title: 'Account',
    description: 'Manage your account settings and data',
    href: '/settings/account',
    icon: User,
  },
];

export default function SettingsPage() {
  return (
    <Page
      title="Settings"
      description="Configure your application preferences"
      breadcrumbs={[{ label: 'Settings' }]}
    >
      <div className="grid gap-px bg-border border">
        {settingsPages.map((page) => (
          <Link key={page.href} href={page.href}>
            <div className="p-8 bg-background hover:bg-muted/30 transition-colors cursor-pointer group flex items-start gap-6">
              <div className="p-3 bg-primary/5 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <page.icon className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-sm uppercase tracking-widest mb-2">
                  {page.title}
                </h3>
                <p className="text-sm text-muted-foreground">{page.description}</p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors mt-1" />
            </div>
          </Link>
        ))}
      </div>
    </Page>
  );
}
