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
