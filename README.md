# Admin Dashboard - Cognitive Mock Test Platform

A production-ready React + TypeScript admin dashboard for managing cognitive mock tests with an advanced puzzle builder.

## 🎯 Features

### Dashboard Page
- 📊 Real-time analytics with key metrics
  - Total mock tests count
  - Total questions count
  - Total attempts count
  - Average score across all tests
- 📈 Published tests overview
- 📉 Quick KPI statistics

### Mock Test Management
- ✅ Create, read, update, delete (CRUD) operations
- 🔍 Advanced search and filtering
- 📄 Pagination support (10 items per page)
- 🎯 Publish/unpublish tests
- 🏷️ Categorization and difficulty levels
- ⏱️ Duration and question count management

### Puzzle Question Builder
- 🎨 Visual matrix puzzle editor
- 📐 Grid size selection (3x3, 4x4, 5x5)
- 🎯 Symbol picker (circle, square, triangle, star)
- ✏️ Interactive cell editing
- 🔒 Validation rules:
  - No repeated symbols in rows
  - No repeated symbols in columns
  - Missing cell requirement
  - Correct answer selection
- 🎓 Difficulty level assignment
- 💾 Save questions to mock tests

### Results & Analytics
- 📊 Comprehensive results table
- 🔎 Search and filter attempts
- 📈 Sort by score, accuracy, or date
- 📥 CSV export functionality
- 🎯 User score tracking
- ⏱️ Time analysis
- 📊 Pass rate calculations

## 🛠️ Tech Stack

- **Frontend**: React 19
- **Language**: TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui
- **State Management**: Zustand
- **Routing**: React Router v7
- **Forms**: React Hook Form
- **Icons**: Lucide React

## 📁 Folder Structure

```
src/
├── admin/
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── MockTestManagement.tsx
│   │   ├── PuzzleBuilder.tsx
│   │   ├── Results.tsx
│   │   ├── AdminLayout.tsx
│   │   └── index.ts
│   ├── components/
│   │   └── puzzle/
│   │       ├── GridCell.tsx
│   │       ├── PuzzleGrid.tsx
│   │       ├── SymbolPicker.tsx
│   │       └── index.ts
│   ├── layouts/
│   │   ├── Navbar.tsx
│   │   ├── Sidebar.tsx
│   │   └── index.ts
│   ├── store/
│   │   ├── mockTestStore.ts
│   │   ├── puzzleBuilderStore.ts
│   │   └── index.ts
│   ├── services/
│   │   ├── mockTestService.ts
│   │   ├── questionService.ts
│   │   ├── analyticsService.ts
│   │   └── index.ts
│   ├── types/
│   │   ├── mockTest.ts
│   │   ├── puzzle.ts
│   │   ├── analytics.ts
│   │   └── index.ts
│   └── AdminRoutes.tsx
├── components/ui/
│   ├── button.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   ├── input.tsx
│   ├── table.tsx
│   ├── select.tsx
│   ├── tabs.tsx
│   ├── textarea.tsx
│   └── badge.tsx
├── lib/
│   └── utils.ts
├── App.tsx
├── main.tsx
├── App.css
└── index.css
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

## 📝 Type Definitions

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

### Question (Puzzle)
```typescript
type Question = {
  id: string;
  gridSize: number;
  grid: SymbolType[][];
  missingCell: {
    row: number;
    col: number;
  };
  options: SymbolType[];
  correctAnswer: SymbolType;
  difficulty: 'easy' | 'medium' | 'hard';
  mockTestId: string;
  sequence: number;
};
```

### AnalyticsMetrics
```typescript
type AnalyticsMetrics = {
  totalMockTests: number;
  totalQuestions: number;
  totalAttempts: number;
  averageScore: number;
  publishedTests: number;
};
```

## 🎮 State Management

### Zustand Stores

#### MockTestStore
- `mockTests`: Array of all mock tests
- `selectedTest`: Currently selected test
- `isLoading`: Loading state
- `error`: Error message
- Actions: CRUD operations, publish/unpublish

#### PuzzleBuilderStore
- `gridSize`: Current grid dimensions
- `grid`: 2D array of symbols
- `missingCell`: Coordinates of missing cell
- `options`: Answer options
- `correctAnswer`: Correct answer symbol
- `difficulty`: Question difficulty level
- Actions: Cell editing, validation, reset

## 📡 API Services (Mock)

All services use mock data with artificial delays for realistic behavior:

### mockTestService
- `getAllMockTests()`: Fetch all tests (800ms delay)
- `getMockTestById(id)`: Fetch single test (400ms delay)
- `createMockTest(data)`: Create new test (600ms delay)
- `updateMockTest(id, updates)`: Update test (500ms delay)
- `deleteMockTest(id)`: Delete test (400ms delay)
- `togglePublish(id)`: Toggle publish status (300ms delay)
- `searchMockTests(query)`: Search tests (600ms delay)

### questionService
- `getAllQuestions()`: Fetch all questions (800ms delay)
- `getQuestionsByMockTestId(mockTestId)`: Fetch by test (600ms delay)
- `getQuestionById(id)`: Fetch single question (400ms delay)
- `createQuestion(data)`: Create question (600ms delay)
- `updateQuestion(id, updates)`: Update question (500ms delay)
- `deleteQuestion(id)`: Delete question (400ms delay)
- `validateGrid()`: Validate puzzle grid (300ms delay)

### analyticsService
- `getAnalyticsMetrics()`: Get dashboard metrics (800ms delay)
- `getAllAttempts()`: Fetch all attempt results (800ms delay)
- `getAttemptsByMockTestId(id)`: Filter by test (600ms delay)
- `getAttemptsByUserId(id)`: Filter by user (600ms delay)
- `getAttemptById(id)`: Get single attempt (400ms delay)
- `createAttempt(data)`: Record new attempt (600ms delay)

## 🎨 UI Components

### shadcn/ui Components Used
- Button
- Card
- Input
- Dialog
- Table
- Select
- Tabs
- Textarea
- Badge

### Custom Components
- **GridCell**: Clickable grid cell for puzzle editor
- **PuzzleGrid**: 2D grid display for puzzles
- **SymbolPicker**: Symbol selection interface
- **Navbar**: Top navigation with user menu
- **Sidebar**: Side navigation with active state

## 🔐 Features Highlights

✨ **Production-Ready**
- TypeScript strict mode enabled
- Comprehensive error handling
- Loading states and spinners
- Form validation with React Hook Form
- Responsive design for all screen sizes

🎯 **User Experience**
- Smooth transitions and animations
- Interactive feedback on user actions
- Clear error messages
- Empty states handling
- Dark mode support (CSS variables ready)

📱 **Responsive Design**
- Mobile-first approach
- Breakpoints: sm, md, lg
- Touch-friendly interactions
- Adaptive layouts

## 📖 Development

### Project Structure Best Practices
- Modular folder organization
- Separated concerns (components, services, stores)
- Reusable components with clear props
- Type-safe throughout
- Functional components with hooks only

### Code Quality
- ESLint configuration
- TypeScript strict checking
- Proper error handling
- Console logging for debugging
- Clean code principles

## 🚀 Deployment

```bash
# Build for production
npm run build

# Preview build locally
npm run preview

# The dist folder is ready to deploy
```

## 📝 Notes

- Mock data is stored in memory and will reset on page reload
- All delays simulate realistic API calls
- CSV export functionality uses browser's native capabilities
- Validation happens in real-time during puzzle building
- All timestamps use ISO format

## 🤝 Contributing

This is a complete, production-ready dashboard. Future enhancements could include:
- Backend API integration
- Real database persistence
- Advanced analytics charts
- Multi-language support
- Advanced filtering options
- Bulk operations
- User authentication
- Role-based access control
