/**
 * Date and time formatting utilities
 */

type DateInput = string | Date | number;

/**
 * Format options for dates
 */
type DateFormat = 'short' | 'medium' | 'long' | 'relative';

/**
 * Format a date for display
 * 
 * @example
 * ```ts
 * formatDate('2024-01-15') // "Jan 15, 2024"
 * formatDate('2024-01-15', 'short') // "Jan 15, 2024"
 * formatDate('2024-01-15', 'long') // "January 15, 2024"
 * formatDate('2024-01-15', 'relative') // "2 months ago"
 * ```
 */
export function formatDate(date: DateInput, format: DateFormat = 'short'): string {
  const dateObj = date instanceof Date ? date : new Date(date);
  
  if (isNaN(dateObj.getTime())) {
    return 'Invalid date';
  }

  switch (format) {
    case 'short':
      return dateObj.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    
    case 'medium':
      return dateObj.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
    
    case 'long':
      return dateObj.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    
    case 'relative':
      return getRelativeTime(dateObj);
    
    default:
      return dateObj.toLocaleDateString();
  }
}

/**
 * Get relative time string (e.g., "2 hours ago", "in 3 days")
 */
export function getRelativeTime(date: DateInput): string {
  const dateObj = date instanceof Date ? date : new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - dateObj.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffSecs < 60) return 'just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  if (diffWeeks < 4) return `${diffWeeks} week${diffWeeks === 1 ? '' : 's'} ago`;
  if (diffMonths < 12) return `${diffMonths} month${diffMonths === 1 ? '' : 's'} ago`;
  return `${diffYears} year${diffYears === 1 ? '' : 's'} ago`;
}

/**
 * Format a date range (e.g., "Jan 2020 - Present")
 */
export function formatDateRange(
  startDate: DateInput,
  endDate?: DateInput | null,
  presentLabel = 'Present'
): string {
  const start = formatMonthYear(startDate);
  const end = endDate ? formatMonthYear(endDate) : presentLabel;
  return `${start} - ${end}`;
}

/**
 * Format just month and year
 */
export function formatMonthYear(date: DateInput): string {
  const dateObj = date instanceof Date ? date : new Date(date);
  
  if (isNaN(dateObj.getTime())) {
    return 'Invalid date';
  }

  return dateObj.toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  });
}
