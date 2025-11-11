# Multiple Profiles Feature

## Overview

The Resume Optimizer now supports **multiple profiles** per user, allowing users to maintain separate resumes for different roles, industries, or job applications. Each profile can have its own unique data and can be easily managed through the application.

## Key Features

### 1. Profile Management
- **Create Multiple Profiles**: Users can create as many profiles as needed (e.g., "Software Engineer", "Product Manager", "Data Scientist")
- **Set Default Profile**: Mark one profile as default for quick access
- **Rename Profiles**: Update profile names to better organize your resumes
- **Duplicate Profiles**: Quickly create variations by duplicating existing profiles
- **Delete Profiles**: Remove profiles you no longer need (with safeguard to prevent deleting your last profile)

### 2. Profile Switcher UI
- **Vertical Sidebar**: Clean, intuitive sidebar for switching between profiles
- **Visual Indicators**: 
  - ⭐ Star icon for default profile
  - ✓ Checkmark for currently active profile
- **Quick Actions Menu**: Access rename, duplicate, set default, and delete actions via dropdown menu
- **Context-Aware**: Shows active profile name in page header

### 3. Resume Generation with Profiles
- **Profile Selection**: Choose which profile to use as the source for resume generation
- **Default Selection**: Automatically selects your default profile
- **Per-Profile Customization**: Each profile maintains its own work experience, education, skills, etc.

## Architecture

### Database Schema

```prisma
model UserProfile {
  id         String   @id @default(cuid())
  userId     String   // Multiple profiles per user
  name       String   // Profile name (e.g., "Software Engineer")
  isDefault  Boolean  @default(false)  // One default per user
  resume     Json     // JSON Resume schema data
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  
  @@index([userId, createdAt(sort: Desc)])
  @@index([userId, isDefault])
}
```

### Backend Components

#### Repository Layer (`/lib/repositories/profile.repository.ts`)

Data access layer with ownership verification:

```typescript
// List Operations
findAllByUserId(userId): Promise<UserProfile[]>  // All profiles, default first
findById(profileId, userId): Promise<UserProfile | null>
findDefaultByUserId(userId): Promise<UserProfile | null>

// CRUD Operations
create({ userId, name, resume, isDefault })
update(profileId, userId, data)
delete(profileId, userId)

// Utility Operations
unsetAllDefaults(userId)
exists(userId)
count(userId)
```

#### Service Layer (`/lib/services/profile.service.ts`)

Business logic with validation and caching:

```typescript
// Core Operations
getProfiles(userId)  // Cached list
getProfileById(profileId, userId)
getProfile(userId)  // Get default (backward compatibility)
createProfile(userId, name, resume, isDefault)
updateProfile(profileId, userId, data)
deleteProfile(profileId, userId)

// Actions
setDefaultProfile(profileId, userId)
duplicateProfile(profileId, userId, newName?)
```

**Business Rules:**
- Can't delete last profile
- Only one default per user
- All operations verify ownership
- Automatic cache invalidation

#### API Routes

**`/api/profiles`**
- `GET`: List all profiles (default first)
- `POST`: Create new profile

**`/api/profiles/[id]`**
- `GET`: Get specific profile
- `PATCH`: Update profile (name, resume, isDefault)
- `DELETE`: Delete profile (prevents last profile deletion)

**`/api/profiles/[id]/duplicate`**
- `POST`: Duplicate profile with optional new name

**`/api/profiles/[id]/set-default`**
- `POST`: Set profile as default

### Frontend Components

#### ProfileContext (`/lib/contexts/ProfileContext.tsx`)

Global state management for profiles:

```typescript
interface ProfileContextType {
  profiles: Profile[];           // All profiles
  activeProfileId: string | null;  // Currently selected
  activeProfile: Profile | null;   // Full profile data
  loading: boolean;
  error: string | null;
  setActiveProfileId: (id: string) => void;
  refreshProfiles: () => Promise<void>;
}
```

**Features:**
- Auto-loads profiles on authentication
- Persists active profile in sessionStorage
- Provides hooks for components: `useProfile()`

#### ProfileSwitcher (`/components/profile/ProfileSwitcher.tsx`)

Vertical sidebar component for profile management:

**Features:**
- Profile list with visual indicators (star for default, checkmark for active)
- "+ New Profile" button
- Per-profile dropdown menu:
  - Rename
  - Duplicate
  - Set as Default
  - Delete
- Dialog modals for create/rename operations
- Confirmation for destructive actions

**Props:**
```typescript
interface ProfileSwitcherProps {
  currentProfileId?: string;
  onProfileChange?: (profileId: string) => void;
}
```

#### Updated Pages

**Profile Page (`/app/(authenticated)/profile/page.tsx`)**

- Wraps editor with `ProfileProvider` and `ProfileSwitcher`
- URL param support: `/profile?id={profileId}`
- Loads/saves to specific profile via API
- Shows active profile name in header

**Generate Page (`/app/(authenticated)/generate/page.tsx`)**

- Profile selector dropdown
- Auto-selects default profile
- Passes `profileId` to generation API
- Validation: Requires profile selection before generating

## User Workflows

### Creating a New Profile

1. Click "+" button in ProfileSwitcher
2. Enter profile name (e.g., "Frontend Developer")
3. New profile created with empty resume
4. Automatically switches to new profile

### Editing a Profile

1. Click on profile in ProfileSwitcher
2. Edit resume data in editor
3. Auto-saves changes to selected profile
4. Profile name shown in page header

### Generating Resume from Profile

1. Go to Generate page
2. Select source profile from dropdown (defaults to default profile)
3. Paste job description
4. Click "Generate Resume"
5. AI tailors resume using selected profile data

### Managing Profiles

**Rename:**
1. Click "⋮" menu on profile
2. Select "Rename"
3. Enter new name
4. Profile updated

**Duplicate:**
1. Click "⋮" menu on profile
2. Select "Duplicate"
3. Copy created with name "{Original} (Copy)"
4. Edit copy independently

**Set as Default:**
1. Click "⋮" menu on profile
2. Select "Set as Default"
3. Star icon appears next to profile
4. Auto-selected in dropdowns

**Delete:**
1. Click "⋮" menu on profile
2. Select "Delete"
3. Confirm deletion
4. Profile removed (can't delete last profile)

## Migration from Single Profile

### Database Migration

Migration `20251110212605_add_multiple_profiles` handles existing data:

1. Removes unique constraint on `userId`
2. Adds `name` column (default: "Default Profile")
3. Adds `isDefault` column
4. Sets first profile for each user as default
5. Adds indexes for performance

**Result:** Existing profiles automatically converted to named profiles

### API Backward Compatibility

Old endpoints still work:

- `GET /api/profile` → Returns default profile
- `PUT /api/profile` → Updates default profile

New code should use:

- `GET /api/profiles` → List all profiles
- `GET /api/profiles/[id]` → Get specific profile
- `PATCH /api/profiles/[id]` → Update specific profile

## Best Practices

### For Users

1. **Use Descriptive Names**: "Senior Backend Engineer - FinTech" vs "Resume 1"
2. **Set Default**: Mark your most-used profile as default
3. **Organize by Role**: Separate profiles for different career paths
4. **Duplicate for Variations**: Create variations quickly without starting from scratch

### For Developers

1. **Always Use Repository**: Never bypass repository layer for database access
2. **Verify Ownership**: All profile operations check `userId` matches
3. **Handle Defaults**: Use `profileService.setDefaultProfile()` to manage default flag
4. **Cache Invalidation**: Service layer handles cache clearing automatically
5. **Error Handling**: Check for 404 (profile not found) and 401 (unauthorized)

## Testing

### Manual Testing Checklist

- [ ] Create new profile
- [ ] Rename profile
- [ ] Duplicate profile
- [ ] Delete profile (verify can't delete last one)
- [ ] Set default profile
- [ ] Switch between profiles in editor
- [ ] Generate resume from specific profile
- [ ] URL navigation with `?id={profileId}`
- [ ] Profile persistence across page reloads

### API Testing

```bash
# List profiles
curl -H "Cookie: ..." http://localhost:3000/api/profiles

# Create profile
curl -X POST -H "Cookie: ..." -H "Content-Type: application/json" \
  -d '{"name":"Test Profile","resume":{"basics":{"name":"John Doe"}}}' \
  http://localhost:3000/api/profiles

# Update profile
curl -X PATCH -H "Cookie: ..." -H "Content-Type: application/json" \
  -d '{"name":"Updated Name"}' \
  http://localhost:3000/api/profiles/{id}

# Duplicate profile
curl -X POST -H "Cookie: ..." -H "Content-Type: application/json" \
  -d '{"name":"Copy Name"}' \
  http://localhost:3000/api/profiles/{id}/duplicate

# Set default
curl -X POST -H "Cookie: ..." \
  http://localhost:3000/api/profiles/{id}/set-default

# Delete profile
curl -X DELETE -H "Cookie: ..." \
  http://localhost:3000/api/profiles/{id}
```

## Future Enhancements

### Potential Features

- **Profile Templates**: Pre-filled templates for common roles
- **Profile Import/Export**: Share profiles between accounts
- **Profile Tags**: Tag profiles by industry, seniority, etc.
- **Profile Analytics**: Track which profiles generate most successful resumes
- **Profile Comparison**: Side-by-side comparison of multiple profiles
- **Profile Merging**: Combine data from multiple profiles
- **Profile Archive**: Soft-delete instead of hard-delete

### Performance Optimizations

- **Lazy Loading**: Load profile list on-demand
- **Pagination**: For users with many profiles (>50)
- **Incremental Updates**: Only sync changed fields
- **Background Sync**: Queue profile updates for batch processing

## Troubleshooting

### Common Issues

**"Profile not found" error:**
- Verify profile ID is correct
- Check user has access (ownership check)
- Ensure profile wasn't deleted

**Can't delete profile:**
- System prevents deleting last profile
- Create another profile first

**Default profile not auto-selected:**
- Check `isDefault` flag in database
- Verify ProfileContext is wrapping component
- Clear sessionStorage if stale data

**Changes not saving:**
- Check network tab for API errors
- Verify authentication (session valid)
- Check browser console for errors

### Debug Tools

```typescript
// Check ProfileContext state
const { profiles, activeProfileId, activeProfile } = useProfile();
console.log({ profiles, activeProfileId, activeProfile });

// Verify API response
const response = await fetch('/api/profiles');
const data = await response.json();
console.log('Profiles:', data);

// Check sessionStorage
const storedProfileId = sessionStorage.getItem('activeProfileId');
console.log('Stored profile ID:', storedProfileId);
```

## Summary

The multiple profiles feature provides a powerful way for users to manage different versions of their professional profile, each tailored for specific roles or industries. The implementation follows best practices with:

- **Clean Architecture**: Repository → Service → API → Component layers
- **Security**: Ownership verification on all operations
- **UX**: Intuitive sidebar with visual indicators
- **Performance**: Caching and efficient queries
- **Reliability**: Business rules prevent invalid states

Users can now maintain separate profiles for "Software Engineer", "Engineering Manager", "Technical Lead", etc., and quickly generate tailored resumes for each role.
