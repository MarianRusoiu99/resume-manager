/**
 * Tests for UnifiedResumePreview Component
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { UnifiedResumePreview } from '../UnifiedResumePreview';
import type { Resume } from '@/lib/validations/jsonresume';

// Mock dependencies
vi.mock('@/components/templates/PreviewTemplateSelector', () => ({
  PreviewTemplateSelector: () => <div>Template Selector</div>,
}));

vi.mock('@/lib/hooks/useTemplatePreview', () => ({
  useTemplatePreview: () => ({
    htmlContent: '<html><body><h1>Test Resume</h1></body></html>',
    isLoading: false,
    error: null,
  }),
}));

vi.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: { children: React.ReactNode; className?: string }) => <div className={className}>{children}</div>,
  CardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
  CardDescription: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean }) => (
    <button onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
}));

vi.mock('@/components/ui/pagination-controls', () => ({
  PaginationControls: ({ currentPage, totalPages, onPageChange }: { currentPage: number; totalPages: number; onPageChange: (page: number) => void }) => (
    <div data-testid="pagination-controls">
      <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}>
        Previous
      </button>
      <span>
        Page {currentPage} of {totalPages}
      </span>
      <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage >= totalPages}>
        Next
      </button>
    </div>
  ),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('lucide-react', () => ({
  RefreshCw: () => <span>RefreshIcon</span>,
  Download: () => <span>DownloadIcon</span>,
  Maximize2: () => <span>MaximizeIcon</span>,
  X: () => <span>CloseIcon</span>,
  ChevronLeft: () => <span>LeftIcon</span>,
  ChevronRight: () => <span>RightIcon</span>,
}));

const mockResumeData: Resume = {
  basics: {
    name: 'John Doe',
    label: 'Software Engineer',
    email: 'john@example.com',
  },
};

describe('UnifiedResumePreview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      },
      writable: true,
    });
  });

  it('should render the component', () => {
    render(<UnifiedResumePreview resumeData={mockResumeData} />);
    expect(screen.getByText('Live Preview')).toBeDefined();
  });

  it('should render template selector when showTemplateSelector is true', () => {
    render(<UnifiedResumePreview resumeData={mockResumeData} showTemplateSelector={true} />);
    expect(screen.getByText('Template Selector')).toBeDefined();
  });

  it('should not render card when showCard is false', () => {
    render(
      <UnifiedResumePreview resumeData={mockResumeData} showCard={false} />
    );
    expect(screen.queryByText('Live Preview')).toBeNull();
  });

  it('should render pagination controls', async () => {
    render(<UnifiedResumePreview resumeData={mockResumeData} />);
    
    await waitFor(() => {
      expect(screen.getByTestId('pagination-controls')).toBeDefined();
    });
  });

  it('should initialize with page 1', async () => {
    render(<UnifiedResumePreview resumeData={mockResumeData} />);
    
    await waitFor(() => {
      const pagination = screen.getByTestId('pagination-controls');
      expect(pagination.textContent).toContain('Page 1');
    });
  });

  it('should render iframe with correct sandbox attribute', async () => {
    const { container } = render(<UnifiedResumePreview resumeData={mockResumeData} />);
    
    await waitFor(() => {
      const iframe = container.querySelector('iframe');
      expect(iframe).toBeDefined();
      expect(iframe?.getAttribute('sandbox')).toBe('allow-same-origin');
    });
  });

  it('should have refresh button', () => {
    render(<UnifiedResumePreview resumeData={mockResumeData} />);
    const buttons = screen.getAllByRole('button');
    const refreshButton = buttons.find((btn) => btn.textContent?.includes('Refresh'));
    expect(refreshButton).toBeDefined();
  });

  it('should have expand button', () => {
    render(<UnifiedResumePreview resumeData={mockResumeData} />);
    const buttons = screen.getAllByRole('button');
    const expandButton = buttons.find((btn) => btn.textContent?.includes('Expand'));
    expect(expandButton).toBeDefined();
  });

  it('should show download button when resumeId is provided', () => {
    render(<UnifiedResumePreview resumeData={mockResumeData} resumeId="test-id" />);
    const buttons = screen.getAllByRole('button');
    const downloadButton = buttons.find((btn) => btn.textContent?.includes('Download'));
    expect(downloadButton).toBeDefined();
  });

  it('should not show download button when resumeId is not provided', () => {
    render(<UnifiedResumePreview resumeData={mockResumeData} />);
    const buttons = screen.getAllByRole('button');
    const downloadButton = buttons.find((btn) => btn.textContent?.includes('Download'));
    expect(downloadButton).toBeUndefined();
  });
});
