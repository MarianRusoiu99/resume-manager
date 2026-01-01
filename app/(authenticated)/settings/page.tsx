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
      <div className="grid gap-4 md:grid-cols-2">
        {settingsPages.map((page) => (
          <Link key={page.href} href={page.href}>
            <Card className="p-6 hover:bg-muted/50 transition-colors cursor-pointer group">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <page.icon className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors">
                    {page.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">{page.description}</p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors mt-1" />
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </Page>
  );
}
