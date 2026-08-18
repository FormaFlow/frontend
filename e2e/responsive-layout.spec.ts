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
  timer_enabled: false,
  single_submission: true,
  quick_entry_favorite: false,
  reminder_interval_minutes: 120,
  fields_count: 0,
  entries_count: 0,
  created_at: '2026-07-20T10:00:00+00:00',
  updated_at: '2026-07-20T10:00:00+00:00',
  fields: []
}

const learningQuizForm = {
  ...quizForm,
  id: 'form-learning',
  name: 'Математика: проверка ответов',
  fields_count: 2,
  fields: [
    {id: 'learning-number', label: 'Сколько будет 2 + 3?', type: 'number', required: true, points: 10, correctAnswer: '5', answerConfig: {accepted: ['5']}, order: 0},
    {id: 'learning-select', label: 'Поставь знак >, < или =: 3/9 … 5/9.', type: 'select', required: true, points: 10, options: [{label: '>', value: '>'}, {label: '<', value: '<'}, {label: '=', value: '='}], correctAnswer: '<', answerConfig: {correct: ['<']}, order: 1}
  ]
}

const quizEntryForm = {
  ...quizForm,
  id: 'form-quiz-entry',
  fields_count: 2,
  fields: [
    {
      id: 'quiz-required',
      label: 'Very long required quiz question that must keep its marker at the beginning',
      type: 'textarea',
      required: true,
      order: 0
    },
    {
      id: 'quiz-optional',
      label: 'Optional quiz question',
      type: 'text',
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

    if (url.pathname === '/api/v1/workspaces/workspace-learning/learning/today') {
      await route.fulfill({status: 200, headers, json: {
        assignments: [{id: 'assignment-learning', title: 'Диагностика за 1 класс', subject_code: 'math', status: 'assigned', due_at: null}],
        reviews_due: 2, xp_total: 40, streak: {current: 3, longest: 5}, achievements: ['first_steps']
      }})
      return
    }

    if (url.pathname === '/api/v1/workspaces/workspace-learning/learning/assignments/assignment-learning/attempts') {
      await route.fulfill({status: 201, headers, json: {
        attempt: {id: 'attempt-learning', assignment_id: 'assignment-learning', status: 'in_progress', started_at: '2026-08-17T10:00:00+00:00'},
        assessment: {title: 'Диагностика за 1 класс', max_points: 40, questions: [
          {id: 'question-single', prompt: 'Сколько будет 2 + 3?', type: 'single_choice', points: 10, options: [{label: '4', value: '4'}, {label: '5', value: '5'}]},
          {id: 'question-multiple', prompt: 'Выбери чётные числа', type: 'multiple_choice', points: 10, options: [{label: '2', value: '2'}, {label: '3', value: '3'}, {label: '4', value: '4'}]},
          {id: 'question-number', prompt: 'Сколько будет 6 − 1?', type: 'number', points: 10},
          {id: 'question-boolean', prompt: 'Верно ли, что 7 больше 4?', type: 'boolean', points: 10}
        ]}
      }})
      return
    }

    if (url.pathname === '/api/v1/workspaces/workspace-learning/learning/attempts/attempt-learning/submit') {
      await route.fulfill({status: 200, headers, json: {result: {
        attempt_id: 'attempt-learning', score: 40, max_points: 40, xp_total: 90,
        streak: {current: 4, longest: 5}, questions: [
          {id: 'question-single', prompt: 'Сколько будет 2 + 3?', is_correct: true, points_awarded: 10, max_points: 10, answer: '5', correct_answer: {correct: ['5']}},
          {id: 'question-multiple', prompt: 'Выбери чётные числа', is_correct: true, points_awarded: 10, max_points: 10, answer: ['2', '4'], correct_answer: {correct: ['2', '4']}},
          {id: 'question-number', prompt: 'Сколько будет 6 − 1?', is_correct: true, points_awarded: 10, max_points: 10, answer: '5', correct_answer: {accepted: ['5']}},
          {id: 'question-boolean', prompt: 'Верно ли, что 7 больше 4?', is_correct: true, points_awarded: 10, max_points: 10, answer: true, correct_answer: {correct: [true]}}
        ]
      }}})
      return
    }

    if (url.pathname === '/api/v1/forms/form-quiz') {
      await route.fulfill({ status: 200, headers, json: quizForm })
      return
    }

    if (url.pathname === '/api/v1/forms/form-learning') {
      await route.fulfill({status: 200, headers, json: learningQuizForm})
      return
    }

    if (url.pathname === '/api/v1/forms/form-quiz-entry') {
      await route.fulfill({ status: 200, headers, json: quizEntryForm })
      return
    }

    if (url.pathname === '/api/v1/forms/form-quiz-timer') {
      await route.fulfill({
        status: 200,
        headers,
        json: {...quizForm, id: 'form-quiz-timer', timer_enabled: true}
      })
      return
    }

    if (url.pathname === '/api/v1/quizzes') {
      await route.fulfill({
        status: 200,
        headers,
        json: {
          quizzes: [{
            ...quizEntryForm,
            fields: undefined,
            access_type: 'assigned',
            completed_at: null
          }]
        }
      })
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
      const monthTotals: Record<string, {count: number, amount: number}> = {
        '2026-08': {count: 2, amount: 160},
        '2026-07': {count: 4, amount: 100},
        '2026-06': {count: 3, amount: 120}
      }
      const totals = monthTotals[anchor.slice(0, 7)] || {count: 0, amount: 0}
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
              { field: '_count', sum_month: totals.count },
              { field: 'field-1', sum_month: totals.amount }
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

    if (url.pathname === '/api/v1/entries/entry-quiz') {
      await route.fulfill({
        status: 200,
        headers,
        json: {
          id: 'entry-quiz',
          form_id: 'form-quiz-entry',
          data: {'quiz-required': 'Existing answer'},
          tags: ['legacy-tag'],
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

test('quiz details show options and correct answers without placeholder glyphs', async ({page}, testInfo) => {
  await page.goto('/forms/form-learning')
  if (testInfo.project.name === 'mobile-chrome') {
    await expect(page.getByText('Ответ', {exact: true}).first()).toBeVisible()
    const fieldCard = page.getByRole('article').filter({has: page.getByRole('heading', {name: 'Поставь знак >, < или =: 3/9 … 5/9.'})})
    await expect(fieldCard).toBeVisible()
    await expect(fieldCard.getByText('>, <, =', {exact: true})).toBeVisible()
    await expect(fieldCard.locator('dd').nth(1)).toHaveText('<')
    const numberCard = page.getByRole('article').filter({has: page.getByRole('heading', {name: 'Сколько будет 2 + 3?'})})
    await expect(numberCard.locator('dd').nth(1)).toHaveText('5')
  } else {
    await expect(page.getByRole('columnheader', {name: 'Варианты'})).toBeVisible()
    await expect(page.getByRole('columnheader', {name: 'Правильный ответ'})).toBeVisible()
    const fieldRow = page.getByRole('row').filter({has: page.getByRole('cell', {name: 'Поставь знак >, < или =: 3/9 … 5/9.'})})
    await expect(fieldRow).toBeVisible()
    await expect(fieldRow.getByRole('cell', {name: '>, <, ='})).toBeVisible()
    await expect(fieldRow.locator('td').nth(3)).toHaveText('<')
    const numberRow = page.getByRole('row').filter({has: page.getByRole('cell', {name: 'Сколько будет 2 + 3?'})})
    await expect(numberRow.locator('td').nth(3)).toHaveText('5')
  }
  await expectNoHorizontalOverflow(page)
})

test('mobile learner completes all four interactive question types without overflow', async ({page}, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-chrome')
  await page.addInitScript(() => {
    localStorage.setItem('user', JSON.stringify({id: 'learner-1', name: 'Миша', email: null, account_type: 'managed_learner'}))
    localStorage.setItem('login_workspace', JSON.stringify({id: 'workspace-learning', name: 'Семья', slug: 'family', role: 'learner', timezone: 'Europe/Moscow'}))
  })

  await page.goto('/learn')
  await expect(page.getByRole('heading', {name: 'Привет, Миша!'})).toBeVisible()
  await expect(page.getByText('Диагностика за 1 класс')).toBeVisible()
  await expectNoHorizontalOverflow(page)
  await page.getByText('Диагностика за 1 класс').click()

  await page.getByText('5', {exact: true}).click()
  await page.getByRole('button', {name: 'Дальше'}).click()
  await page.getByText('2', {exact: true}).click()
  await page.getByText('4', {exact: true}).click()
  await page.getByRole('button', {name: 'Дальше'}).click()
  await page.getByPlaceholder('Введи число').fill('5')
  await page.getByRole('button', {name: 'Дальше'}).click()
  await page.getByRole('button', {name: 'Да'}).click()
  await page.getByRole('button', {name: 'Завершить'}).click()

  await expect(page.getByRole('heading', {name: 'Отличная работа!'})).toBeVisible()
  await expect(page.getByText('40 из 40 баллов · 100%')).toBeVisible()
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

test('quiz library keeps an opened quiz and its draft available offline', async ({page}, testInfo) => {
  await page.goto('/quizzes')
  await expect(page.getByRole('heading', {name: 'Викторины'})).toBeVisible()
  await expect(page.getByText('School test')).toBeVisible()
  await expect(page.getByText('Назначена')).toBeVisible()
  await page.waitForLoadState('networkidle')
  if (testInfo.project.name === 'mobile-chrome') {
    await page.screenshot({path: testInfo.outputPath('quiz-library-mobile.png'), fullPage: true})
  }

  await page.getByRole('link', {name: 'Открыть'}).click()
  const answer = page.getByLabel('Very long required quiz question that must keep its marker at the beginning')
  await answer.fill('Черновик офлайн-ответа')

  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'onLine', {configurable: true, get: () => false})
  })
  await page.reload()

  await expect(answer).toHaveValue('Черновик офлайн-ответа')
  await page.goto('/quizzes')
  await expect(page.getByText('School test')).toBeVisible()
  await expect(page.getByText('Начата')).toBeVisible()

  await page.getByRole('button', {name: 'Открыть навигацию'}).click()
  const navigation = page.getByRole('navigation', {name: 'Основная навигация'})
  await expect(navigation.getByRole('link', {name: 'Викторины'})).toBeVisible()
  await expect(navigation.getByText('Платежи')).toHaveAttribute('aria-disabled', 'true')
  await expect(navigation.getByText('Скоро')).toBeVisible()
})

test('quick entry statistics are opt-in and remember each explicit choice', async ({page}) => {
  await page.addInitScript(() => localStorage.setItem('formaflow:quick-stats-visible', 'true'))
  await page.goto('/')

  const toggle = page.getByRole('button', {name: 'Статистика'})
  const panel = page.getByTestId('quick-entry-stats')
  await expect(toggle).toHaveAttribute('aria-pressed', 'false')
  await expect(panel).toBeHidden()

  await toggle.click()
  await expect(toggle).toHaveAttribute('aria-pressed', 'true')
  await expect(panel).toBeVisible()
  await page.reload()
  await expect(page.getByTestId('quick-entry-stats')).toBeVisible()

  await page.getByRole('button', {name: 'Статистика'}).click()
  await expect(page.getByTestId('quick-entry-stats')).toBeHidden()
  await page.reload()
  await expect(page.getByTestId('quick-entry-stats')).toBeHidden()
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

test('legacy quiz entry uses the focused questionnaire layout', async ({page}, testInfo) => {
  let createPayload: Record<string, unknown> | undefined
  let updatePayload: Record<string, unknown> | undefined
  page.on('request', request => {
    const path = new URL(request.url()).pathname
    if (request.method() === 'POST' && path === '/api/v1/entries') {
      createPayload = request.postDataJSON()
    }
    if (request.method() === 'PATCH' && path === '/api/v1/entries/entry-quiz') {
      updatePayload = request.postDataJSON()
    }
  })

  await page.goto('/entries/create?form_id=form-quiz-entry')
  await expect(page.getByRole('heading', {name: 'School test'})).toBeVisible()
  await expect(page.getByText('Вопросов: 2')).toBeVisible()
  await expect(page.getByRole('link', {name: 'Назад'})).toBeHidden()
  await expect(page.getByRole('heading', {name: 'Создать запись'})).toBeHidden()
  await expect(page.getByTestId('quiz-timer')).toBeHidden()
  await expect(page.getByText('Теги', {exact: true})).toBeHidden()
  await expect(page.getByLabel('Дата и время создания')).toBeHidden()

  const requiredMarker = page.getByTestId('required-question-marker').first()
  await expect(requiredMarker).toBeVisible()
  await requiredMarker.hover()
  await expect(page.getByRole('tooltip', {name: 'Обязательный вопрос'})).toBeVisible()

  await page.locator('#quiz-required').fill('Answer')
  const submitButton = page.getByRole('button', {name: 'Отправить', exact: true})
  await expect(submitButton).toHaveClass(/w-full/)
  await expect(page.getByRole('link', {name: 'Отмена'})).toBeHidden()
  if (testInfo.project.name === 'mobile-chrome') {
    await page.screenshot({path: testInfo.outputPath('quiz-entry-focused-mobile.png'), fullPage: true})
  }
  await submitButton.click()
  await expect.poll(() => createPayload).toBeDefined()
  expect(createPayload).not.toHaveProperty('tags')
  expect(createPayload).not.toHaveProperty('created_at')
  expect(createPayload).not.toHaveProperty('duration')

  await page.goto('/entries/entry-quiz/edit')
  await expect(page.getByRole('heading', {name: 'Редактировать запись'})).toBeVisible()
  await expect(page.getByText('Теги', {exact: true})).toBeHidden()
  await expect(page.getByLabel('Дата и время создания')).toBeHidden()
  await page.getByRole('button', {name: 'Сохранить', exact: true}).click()
  await expect.poll(() => updatePayload).toBeDefined()
  expect(updatePayload).not.toHaveProperty('tags')
  expect(updatePayload).not.toHaveProperty('created_at')

  await page.goto('/entries/create?form_id=form-1')
  await expect(page.getByText('Теги', {exact: true})).toBeVisible()
  await expect(page.getByLabel('Дата и время создания')).toBeVisible()
})

test('legacy quiz timer is visible only when enabled for the form', async ({page}) => {
  await page.goto('/entries/create?form_id=form-quiz-timer')
  await expect(page.getByTestId('quiz-timer')).toBeVisible()
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
  await page.getByLabel('Использовать таймер').check()
  await page.getByLabel('Напоминать, пока тест не пройден').selectOption('4320')
  await page.getByRole('button', { name: 'Сохранить' }).click()

  await expect.poll(() => updatePayload?.reminder_interval_minutes).toBe(4320)
  expect(updatePayload?.timer_enabled).toBe(true)
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

  await expect(page.getByTestId('stats-current-_count')).toContainText('0')
  const requestsBeforeDayNavigation = weeklyStatsRequests
  await previousDay.click()

  await expect(page.getByTestId('stats-current-_count')).toContainText('2')
  expect(weeklyStatsRequests).toBe(requestsBeforeDayNavigation)
  await expectNoHorizontalOverflow(page)
})

test('statistics forecast is compact, compares yesterday and switches to month', async ({ page }, testInfo) => {
  await page.clock.install({time: new Date(2026, 7, 11, 12, 0)})
  await page.goto('/entries?form_id=form-1')

  await expect(page.getByTestId('stats-current-field-1')).toContainText('60.25 mg')
  await expect(page.getByTestId('stats-secondary-field-1')).toContainText('110 mg')
  await expect(page.getByTestId('stats-current-_count')).toContainText('0')
  await expect(page.getByTestId('stats-secondary-_count')).toContainText('1')
  await expect(page.getByTestId('comparison-field-1')).toContainText('+10 mg')
  await expect(page.getByTestId('comparison-field-1')).toHaveClass(/text-emerald-600/)

  if (testInfo.project.name === 'mobile-chrome') {
    await page.getByTestId('entry-stats-summary').screenshot({path: testInfo.outputPath('stats-forecast-mobile.png')})
  }

  await page.getByTestId('stats-month-tab').click()
  await expect(page.getByTestId('stats-current-field-1')).toContainText('160 mg')
  await expect(page.getByTestId('stats-secondary-field-1')).toContainText('232 mg')
  await expect(page.getByTestId('stats-current-_count')).toContainText('2')
  await expect(page.getByTestId('stats-secondary-_count')).toContainText('4')
  await expectNoHorizontalOverflow(page)

  if (testInfo.project.name === 'mobile-chrome') {
    await page.getByTestId('entry-stats-summary').screenshot({path: testInfo.outputPath('stats-month-mobile.png')})
  }

  await page.getByTestId('stats-previous').click()
  await expect(page.getByTestId('stats-current-field-1')).toContainText('100 mg')
  await expect(page.getByTestId('stats-secondary-field-1')).toContainText('−20 mg')
  await expect(page.getByTestId('stats-secondary-_count')).toContainText('+1')
  if (testInfo.project.name === 'mobile-chrome') {
    await page.getByTestId('entry-stats-summary').screenshot({path: testInfo.outputPath('stats-previous-month-mobile.png')})
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
