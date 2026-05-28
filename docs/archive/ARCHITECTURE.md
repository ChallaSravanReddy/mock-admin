# Architecture & Data Flow Diagrams

## 🏗️ Project Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    ADMIN DASHBOARD                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              React Router (v7)                       │  │
│  │  /admin → Dashboard                                 │  │
│  │  /admin/mock-tests → MockTestManagement             │  │
│  │  /admin/puzzle-builder → PuzzleBuilder              │  │
│  │  /admin/results → Results                           │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ↓                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           AdminLayout (Responsive)                  │  │
│  │  ┌────────────┐  ┌──────────────────────────────┐  │  │
│  │  │   Navbar   │  │      Page Content (Outlet)   │  │  │
│  │  ├────────────┤  │                              │  │  │
│  │  │  Sidebar   │  │  - Dashboard                 │  │  │
│  │  │            │  │  - MockTestMgmt             │  │  │
│  │  │            │  │  - PuzzleBuilder            │  │  │
│  │  │            │  │  - Results                  │  │  │
│  │  └────────────┘  └──────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ↓                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           Components & UI                           │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────────────┐   │  │
│  │  │GridCell  │ │PuzzleGrid│ │SymbolPicker    │   │  │
│  │  └──────────┘ └──────────┘ └──────────────────┘   │  │
│  │  + shadcn/ui Components                           │  │
│  │  Button, Card, Dialog, Input, Table, etc.         │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ↓                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │      Zustand State Management                       │  │
│  │  ┌──────────────────┐  ┌──────────────────────┐   │  │
│  │  │ mockTestStore    │  │ puzzleBuilderStore  │   │  │
│  │  ├──────────────────┤  ├──────────────────────┤   │  │
│  │  │ mockTests[]      │  │ gridSize            │   │  │
│  │  │ selectedTest     │  │ grid[][]            │   │  │
│  │  │ isLoading        │  │ missingCell         │   │  │
│  │  │ error            │  │ options[]           │   │  │
│  │  │ + actions        │  │ correctAnswer       │   │  │
│  │  │                  │  │ difficulty          │   │  │
│  │  │                  │  │ + actions & validate│   │  │
│  │  └──────────────────┘  └──────────────────────┘   │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ↓                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Service Layer (Mock API)                    │  │
│  │  ┌──────────────────┐ ┌───────────────────────┐   │  │
│  │  │mockTestService   │ │ questionService      │   │  │
│  │  │ • getAll()       │ │ • getAll()           │   │  │
│  │  │ • create()       │ │ • create()           │   │  │
│  │  │ • update()       │ │ • update()           │   │  │
│  │  │ • delete()       │ │ • delete()           │   │  │
│  │  │ • togglePublish()│ │ • validateGrid()     │   │  │
│  │  └──────────────────┘ └───────────────────────┘   │  │
│  │  ┌──────────────────────────────────────────────┐  │  │
│  │  │  analyticsService                            │  │  │
│  │  │  • getMetrics()                              │  │  │
│  │  │  • getAllAttempts()                          │  │  │
│  │  │  • getAttemptsByTestId()                     │  │  │
│  │  └──────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ↓                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │        Mock Data Storage (In Memory)                │  │
│  │  • mockTestsData: MockTest[]                        │  │
│  │  • questionsData: Question[]                        │  │
│  │  • attemptsData: AttemptResult[]                    │  │
│  │  (Resets on page reload)                           │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Data Flow: Creating a Mock Test

```
┌─────────────────────────────────────┐
│  User Input Form                    │
│  (MockTestManagement Page)          │
│  - Title                            │
│  - Description                      │
│  - Duration                         │
│  - Questions                        │
│  - Category                         │
│  - Difficulty                       │
└──────────────┬──────────────────────┘
               │
               ↓
┌─────────────────────────────────────┐
│  React Hook Form Validation         │
│  - Check required fields            │
│  - Validate data types              │
│  - Show error messages              │
└──────────────┬──────────────────────┘
               │
               ↓
┌─────────────────────────────────────┐
│  handleSubmit Callback              │
│  - Prepare data (CreateMockTestDTO) │
│  - Call service                     │
│  - Set loading state                │
└──────────────┬──────────────────────┘
               │
               ↓
┌─────────────────────────────────────┐
│  mockTestService.createMockTest()   │
│  - Simulate API delay (600ms)       │
│  - Generate unique ID               │
│  - Add timestamp                    │
│  - Push to mockTestsData array      │
│  - Return new test object           │
└──────────────┬──────────────────────┘
               │
               ↓
┌─────────────────────────────────────┐
│  useMockTestStore.addMockTest()     │
│  - Update store state               │
│  - Add new test to array            │
│  - Trigger re-render                │
│  - Close dialog                     │
└──────────────┬──────────────────────┘
               │
               ↓
┌─────────────────────────────────────┐
│  Component Re-render                │
│  - New test appears in table        │
│  - Form clears                      │
│  - Dialog closes                    │
│  - Table refreshes                  │
└──────────────┬──────────────────────┘
               │
               ↓
┌─────────────────────────────────────┐
│  User Sees Success                  │
│  New test in Mock Test list         │
│  with "Draft" status                │
└─────────────────────────────────────┘
```

---

## 🎨 Data Flow: Building a Puzzle

```
┌──────────────────────────────────────────┐
│  User Selects Grid Size                  │
│  (Puzzle Builder Page)                   │
│  - Click 3x3, 4x4, or 5x5               │
└────────────────┬─────────────────────────┘
                 │
                 ↓
┌──────────────────────────────────────────┐
│  usePuzzleBuilderStore.setGridSize()     │
│  - Create new empty grid                 │
│  - Reset missingCell & options           │
│  - Clear selected cell                   │
└────────────────┬─────────────────────────┘
                 │
                 ↓
┌──────────────────────────────────────────┐
│  Render Updated PuzzleGrid               │
│  - Display NxN grid of empty cells       │
│  - Each cell clickable                   │
└────────────────┬─────────────────────────┘
                 │
                 ↓
┌──────────────────────────────────────────┐
│  User Interaction Loop                   │
│  1. Click cell → handleCellClick()       │
│  2. Select symbol → setSelectedSymbol()  │
│  3. Click "Place Symbol"                 │
│  → usePuzzleBuilderStore.setCell()       │
│  → Grid state updates                    │
│  → Component re-renders                  │
│  (Repeat for multiple cells)             │
└────────────────┬─────────────────────────┘
                 │
                 ↓
┌──────────────────────────────────────────┐
│  Setup Puzzle Details                    │
│  1. Mark missing cell                    │
│     → setMissingCell()                   │
│  2. Add answer options                   │
│     → setOptions([])                     │
│  3. Set correct answer                   │
│     → setCorrectAnswer()                 │
│  4. Choose difficulty                    │
│     → setDifficulty()                    │
└────────────────┬─────────────────────────┘
                 │
                 ↓
┌──────────────────────────────────────────┐
│  Validate Grid                           │
│  usePuzzleBuilderStore.validateGrid()    │
│  Checks:                                 │
│  - Missing cell marked ✓                 │
│  - Correct answer set ✓                  │
│  - No repeated symbols in rows ✓         │
│  - No repeated symbols in cols ✓         │
└────────────────┬─────────────────────────┘
                 │
            ┌────┴────┐
            │          │
            ↓          ↓
    ✅ Valid      ❌ Errors
        │            │
        ↓            ↓
    Proceed    Show error list
        │
        ↓
┌──────────────────────────────────────────┐
│  Click "Save Question"                   │
│  - Open dialog                           │
│  - Show mock test list                   │
│  - User selects test                     │
│  - Click "Save"                          │
└────────────────┬─────────────────────────┘
                 │
                 ↓
┌──────────────────────────────────────────┐
│  questionService.createQuestion()        │
│  - Simulate API delay (600ms)            │
│  - Generate question ID                  │
│  - Store with mockTestId                 │
│  - Push to questionsData                 │
│  - Return question object                │
└────────────────┬─────────────────────────┘
                 │
                 ↓
┌──────────────────────────────────────────┐
│  Success Message                         │
│  "Question saved successfully!"          │
│  - Reset puzzle state                    │
│  - Clear inputs                          │
│  - Close dialog                          │
│  - Ready for next puzzle                 │
└──────────────────────────────────────────┘
```

---

## 🔄 Component Hierarchy

```
App
 └─ Router
     └─ Routes
         └─ Route /admin/*
             └─ AdminRoutes
                 └─ Route (AdminLayout)
                     ├─ Navbar
                     │   ├─ Menu Button
                     │   ├─ Logo
                     │   ├─ Bell Icon
                     │   └─ User Dropdown
                     ├─ Sidebar
                     │   └─ NavLinks
                     │       ├─ Dashboard
                     │       ├─ Mock Tests
                     │       ├─ Puzzle Builder
                     │       └─ Results
                     └─ main (Outlet)
                         ├─ Dashboard Page
                         │   └─ AnalyticsCards
                         ├─ MockTestManagement
                         │   ├─ SearchBar
                         │   ├─ CreateDialog
                         │   │   └─ Form
                         │   └─ TestsTable
                         ├─ PuzzleBuilder
                         │   ├─ GridSizeButtons
                         │   ├─ PuzzleGrid
                         │   │   └─ GridCells[]
                         │   ├─ SymbolPicker
                         │   └─ ConfigPanel
                         │       ├─ MissingCell
                         │       ├─ SymbolPicker
                         │       ├─ Options
                         │       └─ Difficulty
                         └─ Results
                             ├─ FilterBar
                             ├─ StatisticsCards
                             └─ AttemptsTable
```

---

## 📱 Responsive Breakpoints

```
Mobile (xs)          Tablet (md)         Desktop (lg)       Large (xl)
< 640px              768px - 1023px      1024px - 1279px   1280px+

┌─────────┐      ┌──────────────┐    ┌────────────────┐  ┌────────────────┐
│ Sidebar │      │ Navbar       │    │ Navbar         │  │ Navbar         │
│ (hidden)│      │ Sidebar      │    │ Sidebar        │  │ Sidebar        │
├─────────┤      │ Content      │    │ Content        │  │ Content        │
│ Content │      └──────────────┘    │                │  │                │
│ (full)  │      ┌──────────────┐    │ (full width)   │  │ (full width)   │
│         │      │ 2 columns    │    │                │  │                │
│         │      │ stacked      │    │ 3-4 columns    │  │ 4+ columns     │
│         │      │              │    │                │  │                │
└─────────┘      └──────────────┘    │                │  │                │
                                     │                │  │                │
Hamburger        Visible             Visible        Visible
menu toggle      sidebar             sidebar        sidebar
```

---

## 🎯 State Management Flow

```
┌─────────────────────────────────────────────────────┐
│         useMockTestStore (Zustand)                 │
├─────────────────────────────────────────────────────┤
│                                                     │
│  State:                                            │
│  ┌──────────────────────────────────────────────┐ │
│  │ mockTests: MockTest[]                        │ │
│  │ selectedTest: MockTest | null                │ │
│  │ isLoading: boolean                           │ │
│  │ error: string | null                         │ │
│  └──────────────────────────────────────────────┘ │
│                                                     │
│  Actions:                                          │
│  ┌──────────────────────────────────────────────┐ │
│  │ setMockTests(tests)          [BATCH]        │ │
│  │ setSelectedTest(test)         [SELECT]      │ │
│  │ addMockTest(test)             [CREATE]      │ │
│  │ updateMockTest(id, updates)   [UPDATE]      │ │
│  │ deleteMockTest(id)            [DELETE]      │ │
│  │ togglePublishStatus(id)       [PUBLISH]     │ │
│  │ setLoading(loading)           [STATE]       │ │
│  │ setError(error)               [STATE]       │ │
│  └──────────────────────────────────────────────┘ │
│                                                     │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│      usePuzzleBuilderStore (Zustand)               │
├─────────────────────────────────────────────────────┤
│                                                     │
│  State:                                            │
│  ┌──────────────────────────────────────────────┐ │
│  │ gridSize: number (3, 4, or 5)                │ │
│  │ grid: SymbolType[][]                         │ │
│  │ missingCell: {row, col} | null               │ │
│  │ options: SymbolType[]                        │ │
│  │ correctAnswer: SymbolType | null             │ │
│  │ difficulty: 'easy' | 'medium' | 'hard'       │ │
│  └──────────────────────────────────────────────┘ │
│                                                     │
│  Actions:                                          │
│  ┌──────────────────────────────────────────────┐ │
│  │ setGridSize(size)            [GRID SIZE]    │ │
│  │ setCell(row, col, symbol)    [PLACE]        │ │
│  │ clearCell(row, col)          [CLEAR]        │ │
│  │ clearGrid()                  [RESET GRID]   │ │
│  │ setMissingCell(row, col)     [MARK]         │ │
│  │ setOptions(options)          [OPTIONS]      │ │
│  │ setCorrectAnswer(symbol)     [ANSWER]       │ │
│  │ setDifficulty(level)         [DIFFICULTY]   │ │
│  │ validateGrid()               [VALIDATE]     │ │
│  │ resetPuzzle()                [RESET ALL]    │ │
│  └──────────────────────────────────────────────┘ │
│                                                     │
│  Validation Returns:                               │
│  { valid: boolean, errors: string[] }             │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 🔌 Service API Endpoints

```
┌────────────────────────────────────────────────┐
│      mockTestService                           │
├────────────────────────────────────────────────┤
│ GET    getAllMockTests()          → MockTest[] │
│ GET    getMockTestById(id)        → MockTest   │
│ POST   createMockTest(data)       → MockTest   │
│ PUT    updateMockTest(id, data)   → MockTest   │
│ DELETE deleteMockTest(id)         → void       │
│ PATCH  togglePublish(id)          → MockTest   │
│ GET    searchMockTests(query)     → MockTest[] │
│                                                 │
│ (All with 300-800ms delays)                   │
└────────────────────────────────────────────────┘

┌────────────────────────────────────────────────┐
│      questionService                           │
├────────────────────────────────────────────────┤
│ GET    getAllQuestions()          → Question[] │
│ GET    getQuestionsByMockTestId() → Question[] │
│ GET    getQuestionById(id)        → Question   │
│ POST   createQuestion(data)       → Question   │
│ PUT    updateQuestion(id, data)   → Question   │
│ DELETE deleteQuestion(id)         → void       │
│ POST   validateGrid()             → Validation│
│                                                 │
│ (All with 300-800ms delays)                   │
└────────────────────────────────────────────────┘

┌────────────────────────────────────────────────┐
│      analyticsService                          │
├────────────────────────────────────────────────┤
│ GET    getAnalyticsMetrics()      → Metrics    │
│ GET    getAllAttempts()           → Attempt[]  │
│ GET    getAttemptsByMockTestId()  → Attempt[]  │
│ GET    getAttemptsByUserId()      → Attempt[]  │
│ GET    getAttemptById(id)         → Attempt    │
│ POST   createAttempt(data)        → Attempt    │
│                                                 │
│ (All with 300-800ms delays)                   │
└────────────────────────────────────────────────┘
```

---

## 🎯 Type System Overview

```
ROOT TYPES (types/index.ts)
    ↓
    ├─ MockTest
    │   ├─ CreateMockTestDTO
    │   └─ UpdateMockTestDTO
    │
    ├─ Question
    │   ├─ SymbolType
    │   ├─ GridCellType
    │   └─ PuzzleGridState
    │
    └─ Analytics
        ├─ AnalyticsMetrics
        └─ AttemptResult

Zustand STORE TYPES (store/)
    ↓
    ├─ MockTestStore
    │   └─ useMockTestStore()
    │
    └─ PuzzleBuilderStore
        └─ usePuzzleBuilderStore()

Component PROP TYPES (components/)
    ↓
    ├─ NavbarProps
    ├─ SidebarProps
    ├─ GridCellProps
    ├─ PuzzleGridProps
    └─ SymbolPickerProps
```

---

## 📊 Database-Like Structure

```
MockTests Table
├─ id (PK)
├─ title
├─ description
├─ durationMinutes
├─ totalQuestions
├─ category
├─ difficulty
├─ published (boolean)
└─ createdAt

Questions Table
├─ id (PK)
├─ mockTestId (FK)
├─ gridSize
├─ grid (2D array)
├─ missingCell
├─ options
├─ correctAnswer
├─ difficulty
└─ sequence

Attempts Table
├─ id (PK)
├─ userId (FK)
├─ mockTestId (FK)
├─ score
├─ accuracy
├─ timeTaken
└─ attemptedAt

Relationships:
- 1 MockTest : N Questions
- 1 MockTest : N Attempts
- 1 User : N Attempts
```

---

This documentation provides a complete visual understanding of the project architecture and data flows.
