import {expect, test} from '@playwright/test'

const apiPattern = 'http://localhost:8000/api/v1/**'
const headers = {'access-control-allow-origin': 'http://127.0.0.1:4176', 'access-control-allow-credentials': 'true', 'content-type': 'application/json'}

test('admin gets a dedicated assignment history with edit and retake actions', async ({page}, testInfo) => {
  let reopened = false
  await authenticate(page, {id: 'jake', name: 'Jake One', email: 'jake@example.test'})
  await page.route(apiPattern, async route => {
    const path = new URL(route.request().url()).pathname
    if (path === '/api/v1/workspaces') return json(route, {workspaces: [family('owner')]})
    if (path === '/api/v1/workspaces/family/learning/progress') return json(route, {learners: [learner()]})
    if (path === '/api/v1/workspaces/family/learners') return json(route, {learners: [learner(), {id: 'cookie', name: 'Cookie Annie', login: 'cookie', target_grade: 5, timezone: 'Europe/Moscow'}]})
    if (path === '/api/v1/workspaces/family/learning/progress/anna') return json(route, {attempts: [], assignments: [{
      id: 'assignment-1', assessment_title: 'Серьёзная диагностика за 4 класс', subject_code: 'math',
      status: reopened ? 'assigned' : 'completed', assigned_at: '2026-08-18T09:00:00Z', due_at: '2026-08-20T15:00:00Z', completed_at: '2026-08-18T10:00:00Z',
      attempts: [{id: 'attempt-1', status: 'completed', score: 76, max_points: 100, started_at: '2026-08-18T09:00:00Z', completed_at: '2026-08-18T10:00:00Z'}]
    }]})
    if (path.endsWith('/assignments/assignment-1/reopen')) { reopened = true; return json(route, {assignment: {id: 'assignment-1', status: 'assigned'}}) }
    if (path.includes('/assignments/assignment-1')) return json(route, {assignment: {id: 'assignment-1', status: 'completed'}})
    return json(route, {})
  })

  await page.goto('/admin/learners/anna/history')
  await expect(page.getByRole('heading', {name: 'Анна'})).toBeVisible()
  await expect(page.getByText('Серьёзная диагностика за 4 класс')).toBeVisible()
  await expect(page.getByText('76/100 · 76%')).toBeVisible()
  await expect(page.getByLabel('Выполнить до')).toBeVisible()
  page.once('dialog', dialog => dialog.accept())
  await page.getByRole('button', {name: 'Назначить пересдачу'}).click()
  await expect(page.getByText('Пересдача появилась в плане ученика.')).toBeVisible()
  await expect(page.getByText('Назначен', {exact: true})).toBeVisible()
  await page.screenshot({path: testInfo.outputPath('admin-history.png'), fullPage: true})
})

test('learner sees their answer, correct answer, tutor and error-review action', async ({page}, testInfo) => {
  await authenticate(page, {id: 'anna', name: 'Анна', email: null}, family('learner'))
  await page.route(apiPattern, async route => {
    const path = new URL(route.request().url()).pathname
    if (path.endsWith('/assignments/assignment-1/attempts')) return json(route, {attempt: {id: 'attempt-1', assignment_id: 'assignment-1', status: 'in_progress', started_at: '2026-08-19T08:00:00Z'}, assessment: {title: 'Дроби', max_points: 10, questions: [{id: 'q1', prompt: 'Сравни дроби: 3/9 и 5/9', type: 'single_choice', points: 10, options: [{label: '3/9 больше', value: 'greater'}, {label: '3/9 меньше', value: 'less'}]}]}})
    if (path.endsWith('/attempts/attempt-1/submit')) return json(route, {result: {attempt_id: 'attempt-1', score: 0, max_points: 10, xp_total: 10, streak: {current: 1, longest: 1}, questions: [{id: 'q1', prompt: 'Сравни дроби: 3/9 и 5/9', type: 'single_choice', points: 10, options: [{label: '3/9 больше', value: 'greater'}, {label: '3/9 меньше', value: 'less'}], answer: 'greater', is_correct: false, points_awarded: 0, max_points: 10, correct_answer: {correct: ['less']}, explanation: 'При одинаковых знаменателях больше та дробь, у которой больше числитель.'}]}})
    if (path.endsWith('/tutor/explain')) return json(route, {tutor: {provider: 'mock', answer: 'Представь девять одинаковых долек: пять долек больше трёх.', suggestions: ['Нарисовать дроби', 'Повторить правило', 'Решить похожий пример']}})
    return json(route, {})
  })

  await page.goto('/learn/assignments/assignment-1')
  await page.getByText('3/9 больше', {exact: true}).click()
  await page.getByRole('button', {name: 'Завершить'}).click()
  await expect(page.getByText('Твой ответ')).toBeVisible()
  await expect(page.getByText('Правильный ответ')).toBeVisible()
  await expect(page.getByText('3/9 меньше')).toBeVisible()
  await page.getByRole('button', {name: 'Объяснить ещё проще'}).click()
  await expect(page.getByText('Представь девять одинаковых долек')).toBeVisible()
  await expect(page.getByRole('link', {name: 'Разобрать ошибки (1)'})).toBeVisible()
  await page.screenshot({path: testInfo.outputPath('learner-result.png'), fullPage: true})
})

async function authenticate(page: import('@playwright/test').Page, user: Record<string, unknown>, workspace?: Record<string, unknown>) {
  await page.addInitScript(({user, workspace}) => {
    localStorage.setItem('auth_token', 'test-token')
    localStorage.setItem('user', JSON.stringify(user))
    if (workspace) localStorage.setItem('login_workspace', JSON.stringify(workspace))
  }, {user, workspace})
}
function family(role: 'owner' | 'learner') { return {id: 'family', name: 'Семья', slug: 'family-jake', role, timezone: 'Europe/Moscow', modules: {learning: true, tutor: true}} }
function learner() { return {id: 'anna', name: 'Анна', login: 'anna', target_grade: 5, timezone: 'Europe/Moscow', assignments: {total: 1, completed: 1, overdue: 0}, attempts_completed: 1, average_percent: 76, reviews_due: 1, xp_total: 20, streak: {current: 1, longest: 1}, last_activity_at: '2026-08-18T10:00:00Z'} }
async function json(route: import('@playwright/test').Route, body: unknown) { await route.fulfill({status: 200, headers, json: body}) }
