# Admin Dashboard Documentation

A production-ready React + TypeScript admin dashboard for a cognitive mock test platform built with Vite, TailwindCSS, and shadcn/ui.

## Architecture Overview

### Folder Structure

```
src/admin/
├── pages/
│   ├── AdminLayout.tsx          # Main layout wrapper with Sidebar & Navbar
│   ├── Dashboard.tsx             # Analytics dashboard with metrics
│   ├── MockTestManagement.tsx    # CRUD operations for mock tests
│   ├── PuzzleBuilder.tsx         # Visual puzzle grid builder
│   ├── Results.tsx               # Test attempt results and analytics
│   └── index.ts
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx           # Navigation sidebar
│   │   ├── Navbar.tsx            # Top navigation bar
│   │   └── index.ts
│   └── puzzle/
│       ├── GridCell.tsx          # Individual grid cell component
│       ├── PuzzleGrid.tsx        # Complete puzzle grid display
│       ├── SymbolPicker.tsx      # Symbol selection component
│       └── index.ts
├── store/
│   ├── mockTestStore.ts          # Zustand store for mock tests
│   ├── puzzleBuilderStore.ts     # Zustand store for puzzle builder
│   └── index.ts
├── services/
│   ├── mockTestService.ts        # Mock API for mock tests
│   ├── questionService.ts        # Mock API for questions/puzzles
│   ├── analyticsService.ts       # Mock API for analytics data
│   └── index.ts
├── types/
│   ├── mockTest.ts               # Mock test type definitions
│   ├── puzzle.ts                 # Puzzle and question types
│   ├── analytics.ts              # Analytics types
│   └── index.ts
├── AdminRoutes.tsx               # Route configuration for admin
└── README.md                      # This file
```

## Type Definitions

### MockTest
```typescript
type MockTest = {
  id: string;
  title: string;
  description: string;
  durationMinutes: number;
  totalQuestions: number;
  published: boolean;
  createdAt: string;
  category?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
};
```

### Puzzle Question
```typescript
type SymbolType = 'circle' | 'square' | 'triangle' | 'star' | null;

type Question = {
  id: string;
  gridSize: number;                    // 3, 4, or 5
  grid: SymbolType[][];
  missingCell: { row: number; col: number };
  options: SymbolType[];
  correctAnswer: SymbolType;
  difficulty: 'easy' | 'medium' | 'hard';
  mockTestId: string;
  sequence: number;
};
```

### AttemptResult
```typescript
type AttemptResult = {
  id: string;
  userId: string;
  mockTestId: string;
  mockTestTitle: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  accuracy: number;
  timeTaken: number;                 // in seconds
  attemptedAt: string;
};
```

## Zustand Stores

### MockTestStore
Manages all mock test operations:
- `setMockTests` - Set the list of tests
- `addMockTest` - Add a new test
- `updateMockTest` - Update test details
- `deleteMockTest` - Delete a test
- `togglePublishStatus` - Publish/unpublish a test
- `setSelectedTest` - Track current selected test

### PuzzleBuilderStore
Manages puzzle grid state during creation:
- `setGridSize` - Change grid size (3x3, 4x4, 5x5)
- `setCell` - Place symbol in cell
- `clearCell` - Clear a specific cell
- `clearGrid` - Clear entire grid
- `setMissingCell` - Mark the missing cell
- `setOptions` - Set answer options
- `setCorrectAnswer` - Set correct answer
- `setDifficulty` - Set question difficulty
- `validateGrid` - Validate puzzle rules
- `resetPuzzle` - Reset to initial state

## Pages

### Dashboard (`/admin`)
- **Overview**: Real-time analytics and platform metrics
- **Features**:
  - Total mock tests count
  - Total questions count
  - Total attempts count
  - Average score display
  - Published tests count
  - Quick stats panel

### Mock Test Management (`/admin/mock-tests`)
- **Overview**: Create, edit, delete, and publish mock tests
- **Features**:
  - List all mock tests with pagination
  - Search and filter tests
  - Create new test dialog with form validation
  - Edit existing tests
  - Delete tests with confirmation
  - Toggle publish status
  - View test metadata (category, difficulty, duration)

### Puzzle Builder (`/admin/puzzle-builder`)
- **Overview**: Visual interface for creating matrix puzzle questions
- **Features**:
  - Grid size selection (3x3, 4x4, 5x5)
  - Interactive grid editor
  - Symbol picker (circle, square, triangle, star)
  - Mark missing cell
  - Define answer options
  - Set correct answer
  - Difficulty selection (easy, medium, hard)
  - Grid validation (no repeated symbols in rows/columns)
  - Save to specific mock test

### Results (`/admin/results`)
- **Overview**: View and analyze test attempt results
- **Features**:
  - Table of all user attempts
  - Filter by user or mock test
  - Sort by date, score, or accuracy
  - Search functionality
  - Summary statistics (avg score, pass rate, etc.)
  - CSV export functionality
  - Pagination

## Components

### Sidebar
- Navigation with active state indicator
- Logo and branding
- Version display
- Responsive (auto-show on mobile, sticky on desktop)

### Navbar
- Brand logo and title
- Notification bell with count
- User dropdown menu
- Responsive mobile menu toggle

### GridCell
- Individual puzzle cell display
- Shows symbols (circle, square, triangle, star)
- Supports selection state
- Indicates missing cell
- Clickable and interactive

### PuzzleGrid
- Complete grid layout (3x3, 4x4, or 5x5)
- Displays all symbols
- Shows missing cell highlight
- Tracks selected cell
- Handles cell click events

### SymbolPicker
- Symbol selection buttons
- Clear symbol option
- Shows selected state
- Responsive button layout

## Services

All services use mock data with realistic delays to simulate API calls:

### mockTestService
- `getAllMockTests()` - Fetch all tests
- `getMockTestById(id)` - Get single test
- `createMockTest(data)` - Create new test
- `updateMockTest(id, updates)` - Update test
- `deleteMockTest(id)` - Delete test
- `togglePublish(id)` - Toggle publish status
- `searchMockTests(query)` - Search tests

### questionService
- `getAllQuestions()` - Fetch all questions
- `getQuestionsByMockTestId(id)` - Get questions for test
- `getQuestionById(id)` - Get single question
- `createQuestion(data)` - Create new question
- `updateQuestion(id, updates)` - Update question
- `deleteQuestion(id)` - Delete question
- `validateGrid(grid, missingCell)` - Validate grid rules

### analyticsService
- `getAnalyticsMetrics()` - Get dashboard metrics
- `getAllAttempts()` - Get all test attempts
- `getAttemptsByMockTestId(id)` - Get attempts for test
- `getAttemptsByUserId(id)` - Get user attempts
- `getAttemptById(id)` - Get single attempt
- `createAttempt(data)` - Record new attempt

## Features

### Dashboard
- 📊 Real-time analytics with metric cards
- 📈 Quick statistics overview
- 🎯 Performance indicators

### Mock Test Management
- ✅ Full CRUD operations
- 🔍 Search and filter
- 📄 Pagination support
- 🔓 Publish/unpublish control
- ✏️ In-place editing

### Puzzle Builder
- 🎨 Visual grid editor
- 🔲 Adjustable grid sizes (3x3, 4x4, 5x5)
- 🎯 Symbol placement and management
- ✅ Automatic validation (no repeated symbols)
- 📋 Answer options configuration
- 💾 Save to mock tests

### Results
- 📊 Detailed attempt analytics
- 🔍 Advanced filtering and search
- 📈 Performance statistics
- 📥 CSV export
- 📄 Paginated results

## UI Components Used

- **shadcn/ui**: Card, Button, Input, Dialog, Table, Select, Badge, Tabs, Textarea
- **Lucide React**: Icons throughout the interface
- **Tailwind CSS**: Responsive styling
- **React Hook Form**: Form state management
- **Zustand**: State management

## Styling

- **TailwindCSS**: Responsive utility-first CSS
- **Dark Mode Support**: Ready for dark mode implementation
- **Responsive Design**: Mobile-first approach
- **Professional Theme**: Clean, modern interface
- **Consistent Spacing**: Well-defined gap and padding

## Data Flow

1. **Pages** fetch data from **Services**
2. **Services** return mock data with simulated delays
3. **Zustand Stores** manage state updates
4. **Components** consume state from stores
5. **UI Updates** reflect state changes in real-time

## Future Enhancements

- [ ] Backend API integration
- [ ] User authentication
- [ ] Real-time notifications
- [ ] Advanced reporting
- [ ] Bulk operations
- [ ] Dark mode support
- [ ] Export to multiple formats
- [ ] Question bank management
- [ ] Detailed attempt review
- [ ] Performance analytics

## Usage

### Starting the Application
```bash
npm run dev
```

### Building for Production
```bash
npm run build
```

### Navigating the Dashboard
1. Access via `http://localhost:5173/admin`
2. Use sidebar for navigation
3. Create mock tests in Mock Test Management
4. Build puzzle questions in Puzzle Builder
5. View results in Results page

## Notes

- All data is stored in memory (services)
- Refresh will reset all data
- Grid validation prevents invalid puzzle configurations
- Forms include full validation
- Responsive design works on all screen sizes
