import { test, expect } from '@playwright/test'

test('la home redirige a leads y muestra la tabla', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveURL(/\/leads/)
  await expect(page.getByText('Empresa')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Clientes' })).toBeVisible()
  await page.locator('tbody tr').first().waitFor({ state: 'visible' })
  await page.screenshot({ path: 'test-results/leads-table.png', fullPage: true })
})

test('cambiar a la pestaña Curros', async ({ page }) => {
  await page.goto('/leads')
  await page.getByRole('link', { name: 'Curros' }).click()
  await expect(page).toHaveURL(/\/jobs/)
  if ((await page.locator('tbody tr').count()) === 0) {
    await page.request.post('/api/jobs', {
      data: {
        company: 'Ejemplo Remote',
        role: 'Senior iOS Engineer',
        status: 'applied',
        next_action_note: 'seguir en 1 semana',
      },
    })
    await page.reload()
  }
  await page.locator('tbody tr').first().waitFor({ state: 'visible' })
  await page.screenshot({ path: 'test-results/jobs-table.png', fullPage: true })
})

test('abrir el popup de un lead muestra los campos editables y el botón Generar', async ({ page }) => {
  await page.goto('/leads')
  // primera fila de la tabla
  await page.locator('tbody tr').first().click()
  await expect(page.getByRole('button', { name: 'Guardar' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Generar' })).toBeVisible()
  await expect(page.getByText('Generar con Claude Code')).toBeVisible()
  await page.screenshot({ path: 'test-results/lead-popup.png' })
})
