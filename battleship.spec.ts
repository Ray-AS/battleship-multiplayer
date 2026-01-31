import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

// Helper function to wait for board to be fully rendered
async function waitForBoardReady(page: Page) {
  await page.waitForSelector('.board .cell', { state: 'visible' });
  const cellCount = await page.locator('.board .cell').count();
  // Each board should have 100 cells (10x10)
  expect(cellCount).toBeGreaterThanOrEqual(100);
}

// Helper to count ships on a board
async function countShipsOnBoard(page: Page, boardSelector: string) {
  const shipCells = await page.locator(`${boardSelector} .cell.ship`).count();
  return shipCells;
}

// Helper to perform an attack on a specific cell
async function attackCell(page: Page, boardSelector: string, row: number, col: number) {
  // Boards are 10x10, so cell index = row * 10 + col
  const cellIndex = row * 10 + col;
  await page.locator(`${boardSelector} .cell`).nth(cellIndex).click();
}

test('complete singleplayer game flow', async ({page}) => {
  test.setTimeout(120000);

  await page.goto('http://localhost:5173');

  // Ensure buttons and header ar visible
  await expect(page.locator('h1').first()).toHaveText('Battleship');
  await expect(page.locator('button:has-text("Play Vs. Computer")')).toBeVisible();

  await page.click('button:has-text("Play Vs. Computer")');

  // Wait for setup to beging
  await page.waitForSelector('header h1:has-text("Battleship")', { timeout: 5000 });
  await waitForBoardReady(page);

  const boards = await page.locator('.board').count();
  expect(boards).toBe(2);

  // Ensure ready button is visible, then click to transition to "playing" phase and auto-place ships (separate test for checking manual placement)
  await expect(page.locator('button:has-text("I\'m Ready")')).toBeVisible();
  await page.click('button:has-text("I\'m Ready")');
  await page.waitForSelector('.status-bar', { timeout: 5000 });

  // Set AI delay to 0 for faster test execution
  const delayInput = page.locator('input[type="number"]');
  await delayInput.fill('0');
  await expect(delayInput).toHaveValue('0');

  const statusBar = page.locator('.status-bar');
  await expect(statusBar).toBeVisible();

  // Get opponenet board
  const opponentBoard = page.locator('.board-wrapper').nth(1).locator('.board');

  // Going to run the game in a loop till it ends
  let gameEnded = false;
  let attempts = 0;
  const maxAttempts = 100;

  while(!gameEnded && attempts < maxAttempts) {
    attempts++;

    // Check if game has ended
    const gameOverElement = await page.locator('.game-over').count();
    if (gameOverElement > 0) {
      gameEnded = true;
      break;
    }

    // Account for any transition delays
    await page.waitForTimeout(100);

    const isMyTurn = await statusBar.textContent();

    if (isMyTurn?.includes('YOU\'RE ATTACKING')) {
      // Find an unattacked cell and click it
      const emptyCells = await opponentBoard.locator('.cell.empty:not([disabled])').count();
      
      if (emptyCells > 0) {
        // Click first available empty cell
        await opponentBoard.locator('.cell.empty:not([disabled])').first().click();
        
        // Wait for attack to process and AI to respond; account for any "AI delay"
        await page.waitForTimeout(150);
      } else break;
    } else {
      // Wait for AI turn to complete
      await page.waitForTimeout(1000);
    }

    const gameOverCheck = await page.locator('.game-over').count();
    if (gameOverCheck > 0) {
      gameEnded = true;
      break;
    }
  }

  expect(gameEnded).toBe(true);

  /*
    Ensure all relevant game over functions occur:
    - Game over header to be visible
    - Victory or defeat of player dispalyed
    - New game button is visible, and once pressed, returns to starting screen
  */
  const gameOverDiv = page.locator('.game-over');
  await expect(gameOverDiv).toBeVisible();

  const gameOverText = await gameOverDiv.textContent();
  expect(gameOverText).toMatch(/VICTORY!|DEFEAT!/);

  await expect(page.locator('button:has-text("New Game")')).toBeVisible();

  await page.click('button:has-text("New Game")');
  
  await expect(page.locator('button:has-text("Play Vs. Computer")')).toBeVisible();
})

test('manual ship placement with hover validation', async({page}) => {
  await page.goto('http://localhost:5173');

  await page.click('button:has-text("Play Vs. Computer")');
  await waitForBoardReady(page);

  await page.click('button:has-text("Place Ships Manually")');

  // Verify placement mode UI appears
  await expect(page.locator('.placement-info')).toBeVisible();

  // Should show first ship to place (i.e. Carrier - 5 cells)
  await expect(page.locator('.placement-info p')).toContainText('CARRIER');

  // Verify orientation toggle button exists
  const orientationButton = page.locator('.placement-info button:has-text("horizontal")');
  await expect(orientationButton).toBeVisible();

  const playerBoard = page.locator('.board-wrapper').nth(0).locator('.board');

  // Test orientation toggle
  await orientationButton.click();
  await expect(page.locator('.placement-info button')).toContainText('vertical');

  // Toggle back to horizontal
  await page.locator('.placement-info button:has-text("vertical")').click();
  await expect(page.locator('.placement-info button')).toContainText('horizontal');

  // Carrier is 5 cells, placing at column 7 horizontally would extend to column 11 (invalid)
  const cellAt_0_7 = playerBoard.locator('.cell').nth(7);

  await cellAt_0_7.hover();
  await page.waitForTimeout(400);

  // Check for preview classes
  const validPreviewCells = await playerBoard.locator('.cell.preview-valid').count();
  
  expect(validPreviewCells).toBe(0);
  
  // Try to click but placement should be rejected
  await cellAt_0_7.click();
  await page.waitForTimeout(300);

  // Ship shouldn't be placed; should still be on Carrier
  await expect(page.locator('.placement-info p')).toContainText('CARRIER');
  let shipCellCount = await playerBoard.locator('.cell.ship').count();
  expect(shipCellCount).toBe(0);

  // Place carrier horizontally at (0, 0); valid
  const validCell = playerBoard.locator('.cell').nth(0);
  
  // Hover over valid position
  await validCell.hover();
  await page.waitForTimeout(400);
  
  // Check preview: should show valid, not invalid
  const validPreviewAtStart = await playerBoard.locator('.cell.preview-valid').count();
  const invalidPreviewAtStart = await playerBoard.locator('.cell.preview-invalid').count();
  
  // Valid position should not have invalid preview
  expect(invalidPreviewAtStart).toBe(0);
  
  // Click to place the carrier
  await validCell.click();
  await page.waitForTimeout(500);

  // Verify moved to next ship (i.e. Battleship - 4 cells)
  await expect(page.locator('.placement-info p')).toContainText('BATTLESHIP');
  
  // Verify carrier was placed (5 cells)
  shipCellCount = await playerBoard.locator('.cell.ship').count();
  expect(shipCellCount).toBe(5);

  // Toggle to vertical
  await page.locator('.placement-info button').click();
  await expect(page.locator('.placement-info button')).toContainText('vertical');
  
  // Try to place at (0, 2) but overlaps with carrier at (0, 0-4)
  const cellAt_0_2 = playerBoard.locator('.cell').nth(2);
  
  await cellAt_0_2.hover();
  await page.waitForTimeout(400);

  // Check for overlap preview
  const overlapValidPreview = await playerBoard.locator('.cell.preview-valid').count();
  
  expect(overlapValidPreview).toBe(0);

  // Try to place; should fail
  await cellAt_0_2.click();
  await page.waitForTimeout(300);

  // Should still be on Battleship, not placed yet
  await expect(page.locator('.placement-info p')).toContainText('BATTLESHIP');
  shipCellCount = await playerBoard.locator('.cell.ship').count();
  expect(shipCellCount).toBe(5); // Only carrier
  
  // Place battleship vertically at (0, 6); doesn't overlap
  const battleshipCell = playerBoard.locator('.cell').nth(6);
  await battleshipCell.hover();
  await page.waitForTimeout(400);
  await battleshipCell.click();
  await page.waitForTimeout(500);

  // Should be on cruiser
  await expect(page.locator('.placement-info p')).toContainText('CRUISER');
  
  // Toggle back to horizontal and place at (5, 0)
  await page.locator('.placement-info button').click();
  await expect(page.locator('.placement-info button')).toContainText('horizontal');
  
  const cruiserCell = playerBoard.locator('.cell').nth(50);
  await cruiserCell.hover();
  await page.waitForTimeout(400);
  await cruiserCell.click();
  await page.waitForTimeout(500);

  // Place submarine at (7, 0)
  await expect(page.locator('.placement-info p')).toContainText('SUBMARINE');
  
  const submarineCell = playerBoard.locator('.cell').nth(70);
  await submarineCell.hover();
  await page.waitForTimeout(400);
  await submarineCell.click();
  await page.waitForTimeout(500);
  
  // Place destroyer at (9, 0)
  await expect(page.locator('.placement-info p')).toContainText('DESTROYER');
  
  const destroyerCell = playerBoard.locator('.cell').nth(90);
  await destroyerCell.hover();
  await page.waitForTimeout(400);
  await destroyerCell.click();
  await page.waitForTimeout(500);

  // Placement should be complete and "I'm Ready" button should appear
  await expect(page.locator('button:has-text("I\'m Ready")')).toBeVisible();

  // Count ships on player board: should have 5 ships with total of 17 cells
  const shipCells = await playerBoard.locator('.cell.ship').count();
  expect(shipCells).toBe(17);
  
  await page.click('button:has-text("I\'m Ready")');
  
  // Ensure transition to playing phase
  await page.waitForSelector('.status-bar', { timeout: 5000 });
  await expect(page.locator('.status-bar')).toBeVisible();
});
