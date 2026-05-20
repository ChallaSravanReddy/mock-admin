# Technical Implementation Guide

## Architecture Overview

### Design Patterns Used

#### 1. **Component-Based Architecture**
- Functional components only (no class components)
- React hooks for state management (useState, useEffect, useContext)
- Custom hooks for reusable logic

#### 2. **State Management with Zustand**
- Centralized global state stores
- Devtools middleware for debugging
- Minimal boilerplate
- Easy to scale

#### 3. **Service Layer Pattern**
- Mock services simulate API calls
- Easy transition to real backend
- Consistent error handling
- Data transformation layer

#### 4. **Container/Presentational Pattern**
- Pages handle business logic and data fetching
- Components focus on rendering
- Clear separation of concerns

## File Organization

```
src/admin/
├── pages/           # Page-level components with business logic
├── components/      # Reusable UI components
├── store/          # Zustand stores
├── services/       # API layer and data management
└── types/          # TypeScript type definitions
```

## Data Flow

### Example: Creating a Mock Test

```
User Input (Form) 
    ↓
handleSubmit (MockTestManagement page)
    ↓
mockTestService.createMockTest(data)
    ↓
Mock data processed, delay simulated
    ↓
Service returns new MockTest object
    ↓
addMockTest (Zustand store)
    ↓
Store state updated
    ↓
Component re-renders with new data
```

## State Management

### Zustand Store Structure

```typescript
// Create store with devtools
const useStore = create<StoreType>()(
  devtools(
    (set, get) => ({
      // State
      items: [],
      
      // Actions
      setItems: (items) => set({ items }),
      addItem: (item) => set((state) => ({
        items: [...state.items, item]
      })),
      
      // Computed/derived state
      getItemCount: () => get().items.length
    }),
    { name: 'StoreName' }
  )
);
```

### Using Stores in Components

```typescript
import { useMockTestStore } from '../../store';

export const Component: React.FC = () => {
  const { mockTests, addMockTest } = useMockTestStore();
  
  return <div>{mockTests.length}</div>;
};
```

## Service Layer

### Service Pattern

```typescript
// Services use promises and delays to simulate API calls
export const service = {
  getAll: async (): Promise<Type[]> => {
    await delay(800);
    return data;
  },
  
  create: async (data: CreateDTO): Promise<Type> => {
    await delay(600);
    const item = { ...data, id: generateId() };
    dataArray.push(item);
    return item;
  }
};
```

### Adding Real Backend

Replace service implementation:

```typescript
// Before: Mock service
export const mockTestService = {
  getAllMockTests: async () => {
    await delay(800);
    return mockTestsData;
  }
};

// After: Real API
export const mockTestService = {
  getAllMockTests: async () => {
    const response = await fetch('/api/mock-tests');
    return response.json();
  }
};
```

## Component Development

### Creating a New Page

```typescript
import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { useYourStore } from '../../store';
import { yourService } from '../../services';

export const YourPage: React.FC = () => {
  const { items, setItems, isLoading } = useYourStore();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await yourService.getAll();
        setItems(data);
      } catch (err) {
        setError('Failed to load data');
      }
    };
    
    loadData();
  }, [setItems]);

  return (
    <div>
      {error && <div className="error">{error}</div>}
      {isLoading ? <Spinner /> : <Content items={items} />}
    </div>
  );
};
```

### Creating a Reusable Component

```typescript
interface Props {
  data: Type;
  onSelect?: (item: Type) => void;
  isActive?: boolean;
}

export const YourComponent: React.FC<Props> = ({ 
  data, 
  onSelect, 
  isActive = false 
}) => {
  return (
    <button
      onClick={() => onSelect?.(data)}
      className={cn(
        'base-styles',
        isActive && 'active-styles'
      )}
    >
      {data.name}
    </button>
  );
};
```

## Type Safety

### Type Hierarchy

```
Root Types (types/index.ts)
    ↓
Service DTOs (Create*, Update* types)
    ↓
Zustand State Types (Store interfaces)
    ↓
Component Props (React.FC<Props>)
```

### Example: Complete Type Chain

```typescript
// 1. Core type (types/mockTest.ts)
export type MockTest = { id: string; title: string; ... };

// 2. DTO (types/mockTest.ts)
export type CreateMockTestDTO = Omit<MockTest, 'id' | 'createdAt'>;

// 3. Store (store/mockTestStore.ts)
interface MockTestStore {
  mockTests: MockTest[];
  addMockTest: (test: MockTest) => void;
}

// 4. Component Props
interface MockTestCardProps {
  test: MockTest;
  onEdit: (test: MockTest) => void;
}
```

## Form Handling

### Using React Hook Form

```typescript
import { useForm } from 'react-hook-form';

interface FormData {
  title: string;
  description: string;
}

const { register, handleSubmit, formState: { errors } } = useForm<FormData>();

const onSubmit = handleSubmit(async (data) => {
  const result = await service.create(data);
  // Handle result
});

return (
  <form onSubmit={onSubmit}>
    <input {...register('title', { required: 'Required' })} />
    {errors.title && <span>{errors.title.message}</span>}
  </form>
);
```

## Styling with Tailwind

### Class Utilities

```typescript
import { cn } from '@/lib/utils';

// Conditional styling
className={cn(
  'base-classes',
  isActive && 'active-classes',
  isDark && 'dark-classes'
)}

// Array of classes
const buttonClasses = ['px-4', 'py-2', 'rounded'];
className={cn(...buttonClasses)}
```

## Error Handling

### Service Error Pattern

```typescript
export const service = {
  deleteItem: async (id: string) => {
    try {
      const item = data.find(i => i.id === id);
      if (!item) {
        throw new Error('Item not found');
      }
      // Delete logic
    } catch (error) {
      console.error('Delete failed:', error);
      throw error;
    }
  }
};
```

### Page Error Handling

```typescript
const [error, setError] = useState<string | null>(null);

try {
  const result = await service.method();
} catch (err) {
  setError(err instanceof Error ? err.message : 'An error occurred');
} finally {
  setLoading(false);
}

// UI
{error && (
  <div className="p-4 bg-red-50 border border-red-200 rounded">
    {error}
  </div>
)}
```

## Performance Optimization

### Memoization

```typescript
import { useMemo, useCallback } from 'react';

// Memoize expensive computations
const filteredItems = useMemo(() => {
  return items.filter(item => item.title.includes(search));
}, [items, search]);

// Memoize callbacks
const handleClick = useCallback((id: string) => {
  updateItem(id);
}, [updateItem]);
```

### Code Splitting

```typescript
// Lazy load pages
import { lazy, Suspense } from 'react';

const Dashboard = lazy(() => import('./Dashboard'));

<Suspense fallback={<Loading />}>
  <Dashboard />
</Suspense>
```

## Testing Considerations

### Component Testing

```typescript
import { render, screen } from '@testing-library/react';
import { YourComponent } from './YourComponent';

describe('YourComponent', () => {
  it('renders correctly', () => {
    render(<YourComponent data={mockData} />);
    expect(screen.getByText(mockData.title)).toBeInTheDocument();
  });
});
```

### Service Testing

```typescript
import { mockTestService } from './mockTestService';

describe('mockTestService', () => {
  it('creates test', async () => {
    const result = await mockTestService.createMockTest({
      title: 'Test',
      // ...
    });
    expect(result.id).toBeDefined();
  });
});
```

## Future Enhancement Guide

### Adding Dark Mode

```typescript
// 1. Create context
const ThemeContext = React.createContext('light');

// 2. Add toggle function
const toggleTheme = () => {
  setTheme(theme === 'light' ? 'dark' : 'light');
};

// 3. Update Tailwind config
// tailwind.config.ts
export default {
  darkMode: 'class',
  // ...
}

// 4. Apply to components
className="bg-white dark:bg-slate-900"
```

### Adding Authentication

```typescript
// 1. Create auth service
export const authService = {
  login: async (email: string, password: string) => {
    // Call auth API
  },
  logout: async () => {
    // Call auth API
  }
};

// 2. Create auth store
const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  login: async (credentials) => {
    const user = await authService.login(credentials);
    set({ user });
  }
}));

// 3. Protect routes
<Route path="/admin/*" element={<ProtectedRoute><AdminRoutes /></ProtectedRoute>} />
```

### Backend Integration

1. Replace service implementations with API calls
2. Update error handling for HTTP errors
3. Add request/response interceptors
4. Implement proper loading states
5. Add authentication tokens to requests
6. Handle CORS if needed

## Best Practices

### Code Organization
✅ One component per file
✅ Group related logic in services
✅ Use index.ts for clean exports
✅ Organize by feature/domain

### Performance
✅ Use useMemo for expensive computations
✅ Implement pagination for large lists
✅ Debounce search inputs
✅ Lazy load images and components

### Type Safety
✅ Avoid `any` types
✅ Use strict mode in tsconfig
✅ Define types at module boundaries
✅ Leverage discriminated unions

### Maintainability
✅ Clear naming conventions
✅ Consistent code style
✅ Comprehensive comments
✅ Modular functions
✅ DRY principle

### Scalability
✅ Plan for feature additions
✅ Abstract API layer
✅ Use composition over inheritance
✅ Keep stores focused
✅ Separate concerns properly

## Debugging

### Browser DevTools
1. **Redux DevTools** - See Zustand store changes
2. **React DevTools** - Component tree inspection
3. **Network tab** - Monitor service calls

### Logging Strategy

```typescript
// Development logging
if (process.env.NODE_ENV === 'development') {
  console.log('Store updated:', state);
}

// Error tracking
try {
  // operation
} catch (error) {
  console.error('Operation failed:', error);
  // Send to error tracking service (Sentry, etc.)
}
```

## Deployment Checklist

- [ ] Remove console logs
- [ ] Test all pages
- [ ] Verify error handling
- [ ] Check responsive design
- [ ] Optimize bundle size
- [ ] Update environment variables
- [ ] Add error tracking
- [ ] Set up monitoring
- [ ] Document API changes
- [ ] Create user guide
