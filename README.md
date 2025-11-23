# FormaFlow Frontend

Современный Vue 3 frontend для системы построения и управления формами FormaFlow.

## Особенности

- ✨ **Vue 3 + TypeScript** - Современная архитектура с типизацией
- 🎨 **Tailwind CSS** - Utility-first CSS фреймворк
- 🌓 **Темная тема** - Поддержка светлая/темная/системная тема
- 🌍 **Многоязычность** - Поддержка English и Russian
- 📱 **Mobile-first** - Адаптивный дизайн для всех устройств
- 🚀 **PWA** - Установка как приложение на рабочий стол
- 🔐 **Авторизация** - Token-based authentication
- 📊 **Управление данными** - Pinia store management
- ⚡ **Vite** - Быстрый dev-сервер и сборка

## Требования

- Node.js >= 18.0.0
- npm >= 9.0.0 или yarn >= 1.22.0

## Установка

\`\`\`bash
# Клонируйте репозиторий
git clone https://github.com/yourusername/forma-flow-frontend.git
cd forma-flow-frontend

# Установите зависимости
npm install

# Скопируйте .env файл
cp .env.example .env

# Отредактируйте .env (если нужно)
# VITE_API_BASE_URL=http://localhost:8000/api/v1

# Запустите dev-сервер
npm run dev
\`\`\`

Приложение будет доступно по адресу: `http://localhost:5173`

## Команды

\`\`\`bash
# Development server
npm run dev

# Build для production
npm run build

# Preview production build
npm run preview

# Type checking
npm run type-check

# Linting
npm run lint
\`\`\`

## Структура проекта

\`\`\`
src/
├── api/                  # API клиенты и эндпоинты
├── assets/              # Статические ресурсы
├── components/          # Vue компоненты
│   ├── common/         # Общие компоненты
│   ├── forms/          # Компоненты для форм
│   ├── entries/        # Компоненты для записей
│   └── layout/         # Layout компоненты
├── composables/         # Композиционные функции
├── layouts/            # Page layouts
├── locales/            # Переводы (i18n)
├── router/             # Vue Router
├── stores/             # Pinia stores
├── types/              # TypeScript типы
├── utils/              # Утилиты и хелперы
├── views/              # Page views
├── App.vue
└── main.ts
\`\`\`

## Разработка

### Добавление нового компонента

\`\`\`vue
<template>
  <div class="card">
    <h1>{{ title }}</h1>
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title: string
}

defineProps<Props>()
</script>
\`\`\`

### Использование composables

\`\`\`typescript
import { useForms } from '@/composables/useForms'

export default {
  setup() {
    const { forms, loading, fetchForms } = useForms()
    
    onMounted(async () => {
      await fetchForms()
    })
    
    return { forms, loading }
  }
}
\`\`\`

### Работа с i18n

\`\`\`vue
<template>
  <h1>{{ $t('forms.title') }}</h1>
  <p>{{ $t('common.welcome') }}</p>
</template>
\`\`\`

### Использование stores

\`\`\`typescript
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const isAuthenticated = computed(() => authStore.isAuthenticated)
\`\`\`

## API Integration

Frontend соединяется с backend API по адресу, указанному в `VITE_API_BASE_URL`.

### Supported Endpoints

**Auth**
- `POST /auth/register` - Регистрация
- `POST /auth/login` - Вход
- `POST /auth/logout` - Выход
- `POST /auth/refresh` - Обновление токена
- `GET /auth/profile` - Профиль пользователя

**Forms**
- `GET /forms` - Список форм (с пагинацией)
- `POST /forms` - Создать форму
- `GET /forms/:id` - Детали формы
- `PATCH /forms/:id` - Обновить форму
- `DELETE /forms/:id` - Удалить форму
- `POST /forms/:id/publish` - Опубликовать форму
- `POST /forms/:id/fields` - Добавить поле
- `DELETE /forms/:id/fields/:fieldId` - Удалить поле

**Entries**
- `GET /entries` - Список записей (с пагинацией)
- `POST /entries` - Создать запись
- `GET /entries/:id` - Детали записи
- `PATCH /entries/:id` - Обновить запись
- `DELETE /entries/:id` - Удалить запись
- `POST /forms/:id/entries/import` - Массовый импорт записей
- `GET /forms/:id/entries` - Записи по форме

## Deployment

### Vercel

\`\`\`bash
npm install -g vercel
vercel
\`\`\`

### Netlify

\`\`\`bash
npm install -g netlify-cli
netlify deploy --prod
\`\`\`

### Docker

\`\`\`dockerfile
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
\`\`\`

### Docker Compose

\`\`\`yaml
version: '3.8'
services:
  frontend:
    build: .
    ports:
      - "80:80"
    environment:
      - VITE_API_BASE_URL=http://backend:8000/api/v1
    depends_on:
      - backend
  
  backend:
    image: forma-flow-backend
    ports:
      - "8000:8000"
\`\`\`

## Testing

Тесты будут добавлены позже.

\`\`\`bash
# Unit tests
npm run test:unit

# E2E tests
npm run test:e2e
\`\`\`

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers

## Troubleshooting

### CORS Errors

Убедитесь, что backend разрешает запросы с фронтенда:

\`\`\`php
// config/cors.php
'allowed_origins' => ['http://localhost:5173'],
\`\`\`

### PWA не устанавливается

1. Используйте HTTPS (или localhost)
2. Проверьте manifest.json
3. Посмотрите консоль браузера на ошибки Service Worker

### Проблемы с авторизацией

1. Проверьте токен в localStorage
2. Убедитесь, что backend возвращает токен
3. Проверьте настройки Sanctum

## Contributing

1. Fork проекта
2. Создайте feature branch (`git checkout -b feature/Amazing`)
3. Commit изменения (`git commit -m 'Add Amazing'`)
4. Push в branch (`git push origin feature/Amazing`)
5. Откройте Pull Request

## License

MIT License

## Контакты

Для вопросов создавайте issues в репозитории.
