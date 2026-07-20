import { expect, test, type Page } from '@playwright/test'

const formSummaries = [
  {
    id: 'form-1',
    name: 'Very long form name that must stay inside its card',
    description: 'A long description used to verify that the action buttons and content wrap on narrow screens.',
    published: true,
    is_quiz: false,
    single_submission: false,
    quick_entry_favorite: true,
    fields_count: 2,
    entries_count: 12,
    created_at: '2026-07-20T10:00:00+00:00',
    updated_at: '2026-07-20T10:00:00+00:00'
  },
  {
    id: 'form-2',
    name: 'Second form',
    description: null,
    published: false,
    is_quiz: false,
    single_submission: false,
    quick_entry_favorite: false,
    fields_count: 0,
    entries_count: 0,
    created_at: '2026-07-19T10:00:00+00:00',
    updated_at: '2026-07-19T10:00:00+00:00'
  }
]

const fullForm = {
  ...formSummaries[0],
  fields: [
    {
      id: 'field-1',
      label: 'Very long required field label that must wrap',
      type: 'number',
      required: true,
      unit: 'mg',
      order: 0
    },
    {
      id: 'field-2',
      label: 'N',
      type: 'boolean',
      required: false,
      order: 1
    }
  ]
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('auth_token', 'e2e-token')
    localStorage.setItem('user', JSON.stringify({ id: 'user-1', name: 'E2E User', email: 'e2e@example.com' }))
    localStorage.setItem('locale', 'ru')
    localStorage.setItem('theme', 'dark')
  })

  await page.route('http://localhost:8000/api/v1/**', async route => {
    const url = new URL(route.request().url())
    const headers = {
      'access-control-allow-origin': 'http://127.0.0.1:4176',
      'access-control-allow-credentials': 'true',
      'content-type': 'application/json'
    }

    if (url.pathname === '/api/v1/forms/form-1') {
      await route.fulfill({ status: 200, headers, json: fullForm })
      return
    }

    if (url.pathname === '/api/v1/forms') {
      await route.fulfill({
        status: 200,
        headers,
        json: { forms: formSummaries, total: formSummaries.length, limit: 10, offset: 0 }
      })
      return
    }

    if (url.pathname === '/api/v1/entries') {
      await route.fulfill({ status: 200, headers, json: { entries: [], total: 0, limit: 10, offset: 0 } })
      return
    }

    await route.fulfill({ status: 200, headers, json: {} })
  })
})

test('forms list does not create horizontal overflow', async ({ page }) => {
  await page.goto('/forms')
  await expect(page.getByRole('heading', { name: 'Формы' })).toBeVisible()
  await expect(page.getByText('Very long form name that must stay inside its card')).toBeVisible()

  await expectNoHorizontalOverflow(page)
})

test('form field editor does not create horizontal overflow', async ({ page }) => {
  await page.goto('/forms/form-1/edit')
  await expect(page.getByRole('heading', { name: 'Редактировать форму' })).toBeVisible()
  await expect(page.getByText('Very long required field label that must wrap')).toBeVisible()

  await expectNoHorizontalOverflow(page)
})

test('entry form loads its field definition only after selection', async ({ page }) => {
  let detailRequests = 0
  page.on('request', request => {
    if (request.url() === 'http://localhost:8000/api/v1/forms/form-1') {
      detailRequests += 1
    }
  })

  await page.goto('/entries/create')
  await page.getByLabel('Формы').selectOption('form-1')

  await expect(page.getByText('Very long required field label that must wrap')).toBeVisible()
  expect(detailRequests).toBe(1)
})

test('mobile notification has equal side margins', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-chrome')

  await page.goto('/forms')
  await page.evaluate(() => window.dispatchEvent(new Event('online')))

  const notification = page.locator('.notification').first()
  await expect(notification).toBeVisible()

  const readMargins = () => notification.evaluate(element => {
    const rect = element.getBoundingClientRect()
    const viewportWidth = document.documentElement.clientWidth
    return { left: rect.left, right: viewportWidth - rect.right }
  })

  await expect.poll(async () => {
    const margins = await readMargins()
    return Math.abs(margins.left - margins.right)
  }).toBeLessThanOrEqual(1)

  const margins = await readMargins()
  expect(margins.left).toBeGreaterThanOrEqual(15)
})

async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  const result = await page.evaluate(() => {
    const viewportWidth = document.documentElement.clientWidth
    const offenders = Array.from(document.body.querySelectorAll<HTMLElement>('*'))
      .filter(element => {
        const rect = element.getBoundingClientRect()
        return rect.left < -1 || rect.right > viewportWidth + 1
      })
      .slice(0, 10)
      .map(element => ({
        tag: element.tagName,
        className: element.className,
        rect: element.getBoundingClientRect().toJSON()
      }))

    return {
      clientWidth: viewportWidth,
      scrollWidth: document.documentElement.scrollWidth,
      offenders
    }
  })

  expect(result.scrollWidth, JSON.stringify(result.offenders, null, 2)).toBeLessThanOrEqual(result.clientWidth)
  expect(result.offenders).toEqual([])
}
