# FormaFlow Frontend

Современный Vue 3 frontend для системы построения и управления формами FormaFlow.

## Особенности

- ✨ **Vue 3 (Composition API) + TypeScript** - Современная архитектура с сильной типизацией.
- 🎨 **Tailwind CSS** - Utility-first CSS для быстрого и гибкого дизайна.
- 🌓 **Темная тема** - Автоматическая и ручная поддержка тем.
- 🌍 **Многоязычность (i18n)** - Полная поддержка English и Russian.
- 📱 **PWA & Mobile-first** - Установка на рабочий стол и отличная работа на мобильных устройствах.
- 🔐 **Secure Auth** - Token-based аутентификация через Laravel Sanctum.
- 📊 **Dynamic Forms** - Конструктор форм с поддержкой различных типов полей (текст, число, boolean, select и др.).
- 📈 **Analytics** - Интерактивные графики и отчеты на базе Chart.js.

## Требования

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0 (или yarn)

## Быстрый старт

```bash
# Установка зависимостей
npm install

# Настройка переменных окружения
cp .env.example .env

# Запуск в режиме разработки
npm run dev
```

Для проверки PWA и Web Push на телефоне в локальной сети запустите из корня проекта:

```bash
make dev-learning-lan
```

Команда создаёт доверенный локальный сертификат через `mkcert`, запускает API, scheduler и HTTPS Vite. Адрес для телефона будет напечатан в терминале.
Для первого запуска сгенерируйте ключи командой `cd backend && php artisan webpush:generate-vapid` и перенесите напечатанные `VAPID_*` в `backend/.env`.

## Доступные команды (Makefile)

В проекте настроен `Makefile` для удобства разработки:
- `make dev` - запуск dev-сервера (`yarn dev`)
- `make build` - сборка проекта для production
- `make lint` - проверка кода линтером
- `make test` - запуск тестов
- `make deploy` - деплой последней версии на сервер

## Структура проекта

```
src/
├── api/             # Axios инстанс и описание API эндпоинтов
├── components/      # Vue компоненты
│   ├── common/      # Общие UI-компоненты (AppButton, AppInput, AppCheckbox)
│   ├── forms/       # Компоненты конструктора форм
│   ├── entries/     # Компоненты для работы с записями
│   └── dashboard/   # Виджеты дашборда
├── composables/     # Shared logic (useForms, useEntries, useAuth)
├── locales/         # JSON файлы переводов
├── stores/          # Pinia stores (auth, settings)
├── views/           # Страницы (Маршруты)
└── assets/          # Глобальные стили и изображения
```

## API Эндпоинты

Приложение взаимодействует с backend API v1. Основные группы эндпоинтов:

- `POST /register`, `POST /login` - Управление доступом.
- `GET /forms` - Работа с формами и полями.
- `GET /entries` - Работа с ответами пользователей.
- `GET /dashboard`, `POST /reports` - Получение данных для аналитики.

## Разработка

### Добавление новых полей в формы
При добавлении нового типа поля в `EntryEditView` или `EntryCreateView`, используйте компоненты из `src/components/common/`. Например, для логических значений используйте `AppCheckbox`:

```vue
<AppCheckbox
  v-model="data[field.id]"
  :label="field.label"
  :required="field.required"
/>
```

## Деплой

Сборка и доставка кода осуществляется командой:
```bash
make deploy
```
*Команда собирает проект и обновляет файлы на целевом сервере.*

## Тестирование

```bash
npm run test:unit
```

## Лицензия

MIT License
