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
    published: true,
    is_quiz: false,
    single_submission: false,
    quick_entry_favorite: true,
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

const quizForm = {
  id: 'form-quiz',
  name: 'School test',
  description: 'Assigned quiz',
  published: true,
  is_quiz: true,
  single_submission: true,
  quick_entry_favorite: false,
  reminder_interval_minutes: 120,
  fields_count: 0,
  entries_count: 0,
  created_at: '2026-07-20T10:00:00+00:00',
  updated_at: '2026-07-20T10:00:00+00:00',
  fields: []
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

    if (url.pathname === '/api/v1/forms/form-quiz') {
      await route.fulfill({ status: 200, headers, json: quizForm })
      return
    }

    if (url.pathname === '/api/v1/forms/form-quiz/assignments') {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 201,
          headers,
          json: {
            assignments: [{
              id: 'assignment-1',
              recipient: { id: 'child-1', name: 'Child User', email: 'child@example.com' },
              last_notified_at: '2026-07-20T10:00:00+00:00',
              next_reminder_at: '2026-07-20T12:00:00+00:00',
              completed_at: null
            }]
          }
        })
        return
      }
      await route.fulfill({ status: 200, headers, json: { assignments: [] } })
      return
    }

    if (url.pathname === '/api/v1/users/search') {
      await route.fulfill({
        status: 200,
        headers,
        json: { users: [{ id: 'child-1', name: 'Child User', email: 'child@example.com' }] }
      })
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

test('quick entry shows adjacent forms without horizontal overflow', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Создать запись' })).toBeVisible()
  await expect(page.locator('.quick-form-neighbor-name').first()).toContainText('Second form')
  await expect(page.locator('.quick-form-neighbor-name').last()).toContainText('Very long form name')

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

test('quiz reminder interval is submitted from form editor', async ({ page }) => {
  let updatePayload: Record<string, unknown> | null = null
  await page.route('http://localhost:8000/api/v1/forms/form-quiz', async route => {
    const headers = {
      'access-control-allow-origin': 'http://127.0.0.1:4176',
      'access-control-allow-credentials': 'true',
      'content-type': 'application/json'
    }
    if (route.request().method() === 'PATCH') {
      updatePayload = route.request().postDataJSON()
    }
    await route.fulfill({ status: 200, headers, json: quizForm })
  })

  await page.goto('/forms/form-quiz/edit')
  await page.getByLabel('Напоминать, пока тест не пройден').selectOption('4320')
  await page.getByRole('button', { name: 'Сохранить' }).click()

  await expect.poll(() => updatePayload?.reminder_interval_minutes).toBe(4320)
})

test('quiz can be assigned to a searched user without mobile overflow', async ({ page }) => {
  let assignmentPayload: Record<string, unknown> | null = null
  page.on('request', request => {
    if (request.method() === 'POST' && request.url().endsWith('/forms/form-quiz/assignments')) {
      assignmentPayload = request.postDataJSON()
    }
  })

  await page.goto('/forms/form-quiz')
  await page.getByRole('button', { name: 'Поделиться формой' }).click()
  await page.getByLabel('Получатели теста').fill('child')
  await page.getByText('child@example.com').click()
  await page.getByRole('button', { name: 'Назначить тест' }).click()

  await expect.poll(() => assignmentPayload).toEqual({ user_ids: ['child-1'] })
  await expect(page.getByText('Child User · child@example.com')).toBeVisible()
  await page.waitForTimeout(400)
  await expectNoHorizontalOverflow(page)
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
