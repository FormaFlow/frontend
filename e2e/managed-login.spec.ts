import {expect, test} from '@playwright/test'

test('managed login reaches learner plan without an unauthenticated workspace request', async ({page}) => {
  let prematureWorkspaceRequests = 0
  const headers = {
    'access-control-allow-origin': 'http://127.0.0.1:4176',
    'access-control-allow-credentials': 'true',
    'content-type': 'application/json',
  }

  await page.route('http://localhost:8000/api/v1/**', async route => {
    const url = new URL(route.request().url())
    if (url.pathname === '/api/v1/workspaces') {
      prematureWorkspaceRequests++
      await route.fulfill({status: 401, headers, json: {message: 'Unauthenticated.'}})
      return
    }
    if (url.pathname === '/api/v1/managed-login') {
      await route.fulfill({status: 200, headers, json: {
        token: 'managed-token',
        user: {id: 'vova', name: 'Вова', email: null, account_type: 'managed_learner', login: 'vova'},
        workspace: {id: 'family', name: 'Семья', slug: 'family-jake', role: 'learner', timezone: 'Europe/Moscow'},
      }})
      return
    }
    if (url.pathname === '/api/v1/workspaces/family/learning/today') {
      await route.fulfill({status: 200, headers, json: {
        assignments: [{id: 'grade-1', title: 'Математика: уверенная база за 1 класс', subject_code: 'math', status: 'assigned', due_at: null}],
        reviews_due: 0,
        xp_total: 0,
        streak: {current: 0, longest: 0},
        achievements: [],
      }})
      return
    }
    await route.fulfill({status: 200, headers, json: {}})
  })

  await page.goto('/login')
  await page.getByRole('button', {name: 'Ученик'}).click()
  await page.getByLabel('Код семьи').fill('family-jake')
  await page.getByLabel('Логин').fill('vova')
  await page.getByLabel('PIN').fill('4826')
  await page.getByRole('button', {name: 'Начать учиться'}).click()

  await expect(page.getByRole('heading', {name: 'Привет, Вова!'})).toBeVisible()
  await expect(page.getByRole('link', {name: /Математика: уверенная база за 1 класс/})).toBeVisible()
  expect(prematureWorkspaceRequests).toBe(0)
})
