/**
 * Consolidated React Contexts
 * 
 * All application-level contexts are exported from here for consistent imports.
 * Import from '@/lib/contexts' instead of individual context files.
 */

// Editor Context - for resume/profile editing
export { 
  EditorProvider, 
  useEditor, 
  type EditorContextType 
} from './EditorContext';

// Profile Context - for managing user profiles
export { 
  ProfileProvider, 
  useProfile 
} from './ProfileContext';

// Theme Context - for dark/light mode
export { 
  ThemeProvider, 
  useTheme 
} from './ThemeContext';

// Notification Context - for in-app notifications
export {
  NotificationProvider,
  useNotifications,
} from './NotificationContext';

export type { Notification } from './NotificationContext';

// Settings Context - for API providers and AI settings
export {
  SettingsProvider,
  useSettings,
  useCanUseAI,
} from './SettingsContext';
