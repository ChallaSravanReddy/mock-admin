# Quick Start Guide - Admin Dashboard

## Getting Started

### 1. **Access the Dashboard**
Navigate to `http://localhost:5173/admin` in your browser. You'll see:
- Top Navbar with notifications and user menu
- Left Sidebar with navigation
- Main content area with dashboard

### 2. **Dashboard Overview**
The dashboard displays:
- **Total Mock Tests**: Number of all tests created
- **Total Questions**: Total puzzle questions across all tests
- **Total Attempts**: User test submissions
- **Average Score**: Mean score across all attempts
- **Published Tests**: Tests available to users
- **Quick Stats**: Pass rate, completion rate, average time

## Creating Mock Tests

### Step 1: Navigate to Mock Test Management
Click "Mock Tests" in the sidebar → You see the tests list

### Step 2: Click "Create Test"
A dialog will open with a form containing:
- **Title**: Name of the test
- **Description**: What the test is about
- **Duration (minutes)**: How long users have
- **Total Questions**: Number of questions in test
- **Category**: Test category (optional)
- **Difficulty**: Easy, Medium, or Hard

### Step 3: Fill in the Details
Example:
```
Title: Matrix Reasoning Level 1
Description: Basic matrix puzzle questions
Duration: 15 minutes
Total Questions: 10
Category: Reasoning
Difficulty: Easy
```

### Step 4: Submit
Click "Create Test" → Test appears in the list with "Draft" status

### Step 5: Publish the Test
- Click the eye icon to publish (changes to "Published")
- Click again to unpublish

## Building Puzzle Questions

### Step 1: Navigate to Puzzle Builder
Click "Puzzle Builder" in the sidebar

### Step 2: Select Grid Size
Choose between 3x3, 4x4, or 5x5 grids
- **3x3**: 9 cells, easy puzzles
- **4x4**: 16 cells, medium puzzles
- **5x5**: 25 cells, hard puzzles

### Step 3: Build the Grid
1. Click a cell to select it
2. Choose a symbol from the picker (circle, square, triangle, star)
3. Click "Place Symbol" to add it
4. Repeat until most cells are filled

**Key Rules**:
- No repeated symbols in any row
- No repeated symbols in any column
- One cell will be marked as "missing"

### Step 4: Mark Missing Cell
1. Click the cell that should be missing
2. Click "Mark Missing"
- This cell will be highlighted in amber

### Step 5: Define Answer Options
1. Select a symbol from the picker
2. Click "Add Option" to add to choices
3. Repeat for all possible answers (typically 4 options)
- Options should include the correct answer

### Step 6: Set Correct Answer
1. Select the correct symbol
2. Click "Set Answer"
- This marks the answer for the puzzle

### Step 7: Set Difficulty
Select from Easy, Medium, or Hard from the dropdown

### Step 8: Validate and Save
1. Check the validation panel on the right
   - ✅ All rules met: No errors
   - ❌ Issues: Fix any errors shown
2. Click "Save Question"
3. Select the mock test to add this question to
4. Click "Save Question"

**Validation Rules**:
- ❌ "Missing cell must be marked"
- ❌ "Correct answer must be selected"
- ❌ "Row X has repeated symbols"
- ❌ "Column X has repeated symbols"

## Viewing Results

### Navigate to Results
Click "Results" in the sidebar → See all test attempts

### Filter and Sort Results
- **Search**: Find users or tests by name
- **Filter by Test**: Select specific mock test
- **Sort By**:
  - Latest First (default)
  - Score (High to Low)
  - Score (Low to High)
  - Accuracy (High to Low)

### Summary Statistics
At the top:
- **Total Attempts**: Number of attempts
- **Avg Score**: Average percentage
- **Avg Accuracy**: Average correct percentage
- **Pass Rate**: % of attempts with 70%+ accuracy

### Export Results
Click "Export" to download attempts as CSV file

### View Attempt Details
Click "View" button on any row to see full attempt details

## Dashboard Navigation

### Sidebar Menu
- **Dashboard**: Overview and metrics
- **Mock Tests**: Manage test content
- **Puzzle Builder**: Create questions
- **Results**: View attempt analytics
- **Settings**: (placeholder for future)

### Mobile Responsive
- Click menu icon in navbar on mobile
- Sidebar slides in from left
- Click anywhere outside to close

### User Menu
- Click your avatar in top-right
- Options:
  - **Profile**: User profile (coming soon)
  - **Settings**: App settings (coming soon)
  - **Logout**: Sign out (coming soon)

## Best Practices

### Creating Tests
✅ **Do:**
- Use clear, descriptive titles
- Provide meaningful descriptions
- Set realistic durations
- Appropriate difficulty levels
- Organize by category

❌ **Don't:**
- Create tests with 0 questions
- Use vague titles
- Set very short durations
- Skip categories

### Building Puzzles
✅ **Do:**
- Follow the Latin square pattern (no repeats)
- Make clear, distinct symbols
- Provide 4 answer options
- Mark obvious missing cells
- Vary difficulty levels

❌ **Don't:**
- Create ambiguous puzzles
- Have too few options
- Repeat symbols
- Make all puzzles same difficulty

## Common Tasks

### Edit a Mock Test
1. Go to Mock Tests
2. Click edit icon (pencil) on test row
3. Update details in dialog
4. Click "Update Test"

### Delete a Mock Test
1. Go to Mock Tests
2. Click delete icon (trash) on test row
3. Confirm deletion
4. Test is removed

### Clear Grid While Building
Click "Clear Grid" button to reset entire puzzle

### Undo Recent Changes
Reset individual cells with "Clear Cell" button
Or use "Reset All" to start fresh puzzle

## Tips & Tricks

### Grid Building
- Build corner to corner for efficiency
- Use similar difficulty as you create
- Test your puzzles mentally before saving

### Performance
- Keep description concise
- Don't create excessive tests at once
- Archive old/unused tests regularly

### Quality Assurance
- Always validate before saving
- Test a few puzzles as user
- Get feedback before publishing

## Troubleshooting

### "Repeated symbols in row/column" error
- Review marked row/column
- Remove duplicate symbols
- Verify grid follows Latin square pattern

### Can't save question
- Verify missing cell is marked
- Ensure correct answer is selected
- Check validation panel for errors

### Grid looks wrong
- Clear and rebuild grid
- Or use "Reset All" button
- Start fresh

## Keyboard Shortcuts

Coming soon in future versions!

## Support

For issues or questions:
- Check validation error messages
- Review this guide
- Check the admin panel help icons
