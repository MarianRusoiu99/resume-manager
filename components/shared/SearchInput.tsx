'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTransition, memo } from 'react';
import { Input } from '@/components/ui/input';
import { Search, Loader2 } from 'lucide-react';
import { useDebouncedCallback } from '@mantine/hooks';

interface SearchInputProps {
  placeholder?: string;
  defaultValue?: string;
}

export const SearchInput = memo(function SearchInput({ 
  placeholder = "Search...", 
  defaultValue = "" 
}: SearchInputProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const handleSearch = useDebouncedCallback((term: string) => {
    const params = new URLSearchParams(searchParams);
    if (term) {
      params.set('q', term);
    } else {
      params.delete('q');
    }
    
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`);
    });
  }, 300);

  return (
    <div className="relative w-full">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Search className="h-4 w-4" />
        )}
      </div>
      <Input
        type="text"
        placeholder={placeholder}
        className="pl-10"
        defaultValue={defaultValue}
        onChange={(e) => handleSearch(e.target.value)}
      />
    </div>
  );
});