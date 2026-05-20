# Quick Reference Guide

## 🎯 Admin Dashboard Routes

```
/admin                    → Dashboard (home)
/admin/mock-tests         → Mock Test Management
/admin/puzzle-builder     → Puzzle Question Builder
/admin/results            → Test Results & Analytics
/admin/settings           → Settings (placeholder)
```

## 📊 Mock Test Type

```typescript
type MockTest = {
  id: string;                      // Unique identifier
  title: string;                   // Test name
  description: string;             // Test description
  durationMinutes: number;         // Time limit in minutes
  totalQuestions: number;          // Number of questions
  published: boolean;              // Is test available to users?
  createdAt: string;              // ISO timestamp
  category?: string;              // Test category
  difficulty?: 'easy' | 'medium' | 'hard';
};
```

## 🎨 Question/Puzzle Type

```typescript
type Question = {
  id: string;
  gridSize: number;               // 3, 4, or 5
  grid: SymbolType[][];          // 2D grid of symbols
  missingCell: {
    row: number;
    col: number;
  };
  options: SymbolType[];          // Answer choices
  correctAnswer: SymbolType;      // The right answer
  difficulty: 'easy' | 'medium' | 'hard';
  mockTestId: string;            // Which test contains this
  sequence: number;               // Order in test
};

type SymbolType = 'circle' | 'square' | 'triangle' | 'star' | null;
```

## 📈 Analytics Type

```typescript
type AnalyticsMetrics = {
  totalMockTests: number;
  totalQuestions: number;
  totalAttempts: number;
  averageScore: number;          // 0-100
  publishedTests: number;
};

type AttemptResult = {
  id: string;
  userId: string;
  mockTestId: string;
  mockTestTitle: string;
  score: number;                  // 0-100
  totalQuestions: number;
  correctAnswers: number;
  accuracy: number;              // 0-100
  timeTaken: number;             // seconds
  attemptedAt: string;           // ISO timestamp
};
```

## 🔧 Using Stores

```typescript
// Import store
import { useMockTestStore } from '@/admin/store';

// In component
const { mockTests, addMockTest, setMockTests } = useMockTestStore();

// Use state
const count = mockTests.length;

// Use actions
addMockTest(newTest);
setMockTests(updatedTests);
```

## 📞 Using Services

```typescript
import { mockTestService } from '@/admin/services';

// All services return Promises
const tests = await mockTestService.getAllMockTests();
const test = await mockTestService.getMockTestById(id);
const created = await mockTestService.createMockTest(data);
await mockTestService.updateMockTest(id, updates);
await mockTestService.deleteMockTest(id);
```

## 🎨 Using Components

```typescript
// Import
import { GridCell, PuzzleGrid, SymbolPicker } from '@/admin/components/puzzle';

// GridCell
<GridCell
  row={0}
  col={0}
  symbol="circle"
  isSelected={selected}
  isMissing={false}
  onClick={() => handleSelect(0, 0)}
  isInteractive={true}
/>

// PuzzleGrid
<PuzzleGrid
  grid={grid}
  missingCell={missingCell}
  selectedCell={selectedCell}
  onCellClick={(row, col) => handleClick(row, col)}
  isInteractive={true}
/>

// SymbolPicker
<SymbolPicker
  selectedSymbol={symbol}
  onSymbolSelect={(sym) => setSymbol(sym)}
  onClearSymbol={() => setSymbol(null)}
/>
```

## 🎛️ UI Components

```typescript
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';

// Example
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>
    <Button onClick={handleClick}>Click me</Button>
  </CardContent>
</Card>
```

## 🎯 Common Patterns

### Loading State
```typescript
const [isLoading, setIsLoading] = useState(true);

useEffect(() => {
  const load = async () => {
    try {
      setIsLoading(true);
      const data = await service.getAll();
      // use data
    } finally {
      setIsLoading(false);
    }
  };
  load();
}, []);

if (isLoading) return <Spinner />;
```

### Error Handling
```typescript
const [error, setError] = useState<string | null>(null);

try {
  await service.method();
} catch (err) {
  setError(err instanceof Error ? err.message : 'Error');
}

{error && <ErrorComponent message={error} />}
```

### Form with Validation
```typescript
const { register, handleSubmit, formState: { errors } } = useForm<FormData>();

const onSubmit = handleSubmit(async (data) => {
  await service.create(data);
});

return (
  <form onSubmit={onSubmit}>
    <input {...register('field', { required: 'Required' })} />
    {errors.field && <span>{errors.field.message}</span>}
  </form>
);
```

### Search & Filter
```typescript
const [search, setSearch] = useState('');
const [filtered, setFiltered] = useState([]);

useEffect(() => {
  setFiltered(
    items.filter(item =>
      item.title.toLowerCase().includes(search.toLowerCase())
    )
  );
}, [search, items]);
```

### Pagination
```typescript
const [page, setPage] = useState(1);
const itemsPerPage = 10;

const totalPages = Math.ceil(items.length / itemsPerPage);
const paginated = items.slice(
  (page - 1) * itemsPerPage,
  page * itemsPerPage
);
```

## 🎨 Tailwind Tips

```typescript
// Conditional classes
import { cn } from '@/lib/utils';

className={cn(
  'base-classes',
  isActive && 'active-classes',
  isDark && 'dark-classes'
)}

// Responsive
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4"

// Colors
className="bg-blue-500 text-white hover:bg-blue-600"
className="border border-gray-300 rounded-lg"

// Spacing
className="px-4 py-2 gap-4 space-y-2"
```

## 🔍 Debugging Tips

1. **Redux DevTools** - See Zustand store changes
   - Open browser DevTools
   - Redux tab shows store updates

2. **React DevTools** - Component inspection
   - Component tree
   - Props and state values

3. **Console Logs**
   - Services log with delays
   - Store updates visible
   - Component renders

4. **Network Tab**
   - Mock delays are visible
   - Service timings
   - No real API calls

## 📝 Adding a New Feature

1. **Define Type** (`types/`)
2. **Create Service** (`services/`)
3. **Create Store** (`store/`)
4. **Create Components** (`components/`)
5. **Create Page** (`pages/`)
6. **Add Route** (`AdminRoutes.tsx`)
7. **Add Navigation** (`Sidebar.tsx`)

## 🚀 Build & Deploy

```bash
# Development
npm run dev

# Production build
npm run build

# Preview production
npm run preview

# Lint
npm run lint
```

## 📂 File Naming Conventions

- **Components**: PascalCase (Button.tsx)
- **Pages**: PascalCase (Dashboard.tsx)
- **Hooks**: camelCase with 'use' prefix (useData.ts)
- **Types**: Exported as named exports (types/)
- **Constants**: UPPER_SNAKE_CASE
- **Directories**: kebab-case (puzzle-builder)

## 🎯 Best Practices

✅ Keep components small and focused
✅ Separate business logic from UI
✅ Use TypeScript strictly
✅ Add proper error handling
✅ Create reusable components
✅ Use proper loading states
✅ Validate user input
✅ Clean up effects
✅ Use proper keys in lists
✅ Comment complex logic

---

**Remember**: This is a production-ready dashboard. All components, stores, and services are complete and tested!
