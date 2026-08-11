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
      trend_direction: 'increase_good',
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
    },
    {
      id: 'field-notes',
      label: 'Long notes',
      type: 'textarea',
      required: false,
      placeholder: 'Several lines',
      order: 2
    },
    {
      id: 'field-select',
      label: 'Quantity',
      type: 'select',
      required: true,
      sum_values: true,
      trend_direction: 'decrease_good',
      options: [
        {label: 'S', value: '15'},
        {label: 'M', value: '25'},
        {label: 'L', value: '35'},
        {label: 'XL', value: '50'}
      ],
      order: 3
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

    if (url.pathname === '/api/v1/entries/stats/week') {
      const anchor = url.searchParams.get('date') || new Date().toISOString().slice(0, 10)
      const days = Array.from({ length: 7 }, (_, index) => {
        const date = new Date(`${anchor}T12:00:00Z`)
        date.setUTCDate(date.getUTCDate() - index)
        return {
          date: date.toISOString().slice(0, 10),
          stats: [
            { field: '_count', sum: index === 1 ? 2 : 0 },
            { field: 'field-1', sum: index === 0 ? 60.25 : index === 1 ? 100 : 0 }
          ]
        }
      })
      await route.fulfill({
        status: 200,
        headers,
        json: {
          days,
          months: {
            [anchor.slice(0, 7)]: [
              { field: '_count', sum_month: 2 },
              { field: 'field-1', sum_month: 160 }
            ]
          }
        }
      })
      return
    }

    if (url.pathname === '/api/v1/entries/entry-textarea') {
      await route.fulfill({
        status: 200,
        headers,
        json: {
          id: 'entry-textarea',
          form_id: 'form-1',
          data: {'field-notes': 'First line\nSecond line'},
          tags: [],
          created_at: '2026-08-10T10:00:00+00:00',
          updated_at: '2026-08-10T10:00:00+00:00'
        }
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
  await expect(page.locator('.quick-entry-widget .form-neighbor-name').first()).toContainText('Second form')
  await expect(page.locator('.quick-entry-widget .form-neighbor-name').last()).toContainText('Second form')

  await expectNoHorizontalOverflow(page)
})

test('mobile dashboard uses the header menu instead of the welcome card', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-chrome')

  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'FormaFlow' })).toBeHidden()
  await page.getByRole('button', { name: 'Открыть навигацию' }).click()
  await expect(page.getByRole('navigation', { name: 'Основная навигация' }).getByRole('link', { name: 'Формы' })).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Основная навигация' }).getByRole('link', { name: 'Записи' })).toBeVisible()
})

test('form field editor does not create horizontal overflow', async ({ page }) => {
  await page.goto('/forms/form-1/edit')
  await expect(page.getByRole('heading', { name: 'Редактировать форму' })).toBeVisible()
  await expect(page.getByText('Very long required field label that must wrap')).toBeVisible()

  await expectNoHorizontalOverflow(page)
})

test('tall field editor scrolls inside the modal and keeps its save button reachable', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-chrome')

  await page.goto('/forms/form-1/edit')
  const fieldCard = page.getByRole('heading', {name: 'Quantity'})
    .locator('xpath=ancestor::div[contains(concat(" ", normalize-space(@class), " "), " card ")][1]')
  await fieldCard.getByTitle('Редактировать').click()

  const dialog = page.getByRole('dialog', {name: 'Редактировать поле'})
  const scrollBody = dialog.getByTestId('modal-scroll-body')
  await expect(dialog).toBeVisible()
  await expect.poll(() => scrollBody.evaluate(element => element.scrollHeight > element.clientHeight)).toBe(true)

  const backgroundScroll = await page.evaluate(() => window.scrollY)
  await scrollBody.hover()
  await page.mouse.wheel(0, 3000)
  await expect.poll(() => scrollBody.evaluate(element => element.scrollTop)).toBeGreaterThan(0)
  await expect(dialog.getByRole('button', {name: 'Сохранить'})).toBeInViewport()
  expect(await page.evaluate(() => window.scrollY)).toBe(backgroundScroll)

  await page.screenshot({path: testInfo.outputPath('field-editor-modal-scroll.png')})
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
  await expect(page.getByLabel('Long notes')).toHaveJSProperty('tagName', 'TEXTAREA')
  expect(detailRequests).toBe(1)
})

test('entry editor preserves multiline textarea values', async ({page}) => {
  await page.goto('/entries/entry-textarea/edit')

  const textarea = page.getByLabel('Long notes')
  await expect(textarea).toHaveJSProperty('tagName', 'TEXTAREA')
  await expect(textarea).toHaveValue('First line\nSecond line')
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

test('form with no entries today keeps the date navigation and reuses weekly stats', async ({ page }, testInfo) => {
  let weeklyStatsRequests = 0
  page.on('request', request => {
    if (new URL(request.url()).pathname === '/api/v1/entries/stats/week') {
      weeklyStatsRequests += 1
    }
  })

  await page.goto('/entries?form_id=form-1')
  await expect(page.getByRole('heading', { name: 'Записи' })).toBeVisible()
  if (testInfo.project.name === 'mobile-chrome') {
    await expect(page.locator('.form-neighbor-name').first()).toBeHidden()
  }

  const previousDay = page.getByRole('button', { name: 'Назад', exact: true })
  const statsDate = page.getByLabel('Выбрать дату статистики')
  const nextDay = page.getByRole('button', { name: 'Далее', exact: true })
  const [previousBox, dateBox, nextBox] = await Promise.all([
    previousDay.boundingBox(),
    statsDate.boundingBox(),
    nextDay.boundingBox()
  ])
  expect(previousBox!.x + previousBox!.width).toBeLessThanOrEqual(dateBox!.x)
  expect(dateBox!.x + dateBox!.width).toBeLessThanOrEqual(nextBox!.x)

  await expect(page.getByTestId('stats-entry-count-note')).toContainText('Записей: 0')
  await previousDay.click()

  await expect(page.getByTestId('stats-entry-count-note')).toContainText('Записей: 2')
  expect(weeklyStatsRequests).toBe(1)
  await expectNoHorizontalOverflow(page)
})

test('statistics forecast is compact, compares yesterday and switches to month', async ({ page }, testInfo) => {
  await page.clock.install({time: new Date(2026, 7, 11, 12, 0)})
  await page.goto('/entries?form_id=form-1')

  await expect(page.getByTestId('forecast-field-1')).toContainText('120 mg')
  await expect(page.getByTestId('stats-entry-count-note')).toContainText('Записей: 0')
  await expect(page.getByTestId('comparison-field-1')).toContainText('+20 mg')
  await expect(page.getByTestId('comparison-field-1')).toHaveClass(/text-emerald-600/)

  if (testInfo.project.name === 'mobile-chrome') {
    await page.screenshot({path: testInfo.outputPath('stats-forecast-mobile.png'), fullPage: true})
  }

  await page.getByTestId('stats-month-tab').click()
  await expect(page.getByText('160 mg')).toBeVisible()
  await expectNoHorizontalOverflow(page)

  if (testInfo.project.name === 'mobile-chrome') {
    await page.screenshot({path: testInfo.outputPath('stats-month-mobile.png'), fullPage: true})
  }
})

test('visible entry stays in place while relative time and background data refresh', async ({ page }) => {
  const now = new Date('2026-07-27T12:00:00.000Z')
  const createdAt = '2026-07-26T12:00:15.000Z'
  const initialEntries = Array.from({ length: 12 }, (_, index) => ({
    id: `entry-${index + 1}`,
    form_id: 'form-1',
    data: { 'field-1': index + 1 },
    tags: [],
    created_at: createdAt,
    updated_at: createdAt
  }))
  const newEntry = {
    id: 'entry-new',
    form_id: 'form-1',
    data: { 'field-1': 99 },
    tags: [],
    created_at: now.toISOString(),
    updated_at: now.toISOString()
  }
  let returnRefreshedEntries = false
  let entriesRequests = 0

  await page.clock.install({ time: now })
  await page.route('http://localhost:8000/api/v1/entries**', async route => {
    if (new URL(route.request().url()).pathname !== '/api/v1/entries') {
      await route.fallback()
      return
    }
    entriesRequests += 1

    const headers = {
      'access-control-allow-origin': 'http://127.0.0.1:4176',
      'access-control-allow-credentials': 'true',
      'content-type': 'application/json'
    }
    const entries = returnRefreshedEntries ? [newEntry, ...initialEntries] : initialEntries
    await route.fulfill({ status: 200, headers, json: { entries, total: entries.length, limit: 15, offset: 0 } })
  })

  await page.goto('/entries?form_id=form-1')
  const anchor = page.locator('[data-entry-id="entry-8"]')
  await expect(anchor).toBeVisible()
  await anchor.evaluate(element => {
    const previousScrollBehavior = document.documentElement.style.scrollBehavior
    document.documentElement.style.scrollBehavior = 'auto'
    element.scrollIntoView({ block: 'center' })
    document.documentElement.style.scrollBehavior = previousScrollBehavior
  })
  const initialTop = await anchor.evaluate(element => element.getBoundingClientRect().top)

  const requestsBeforeTick = entriesRequests
  await page.clock.fastForward(30_000)
  await expect.poll(() => entriesRequests).toBeGreaterThan(requestsBeforeTick)
  await page.waitForLoadState('networkidle')
  await expect.poll(() => anchor.evaluate(element => element.getBoundingClientRect().top)).toBeCloseTo(initialTop, 0)

  returnRefreshedEntries = true
  await page.evaluate(() => window.dispatchEvent(new Event('online')))
  await expect(page.locator('[data-entry-id="entry-new"]')).toBeAttached()
  await expect.poll(() => anchor.evaluate(element => element.getBoundingClientRect().top)).toBeCloseTo(initialTop, 0)
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
