# Caspian Flow

Пакет для старта хакатонного MVP по [case.md](case.md): прогноз риска пропустить судно, выбор маршрута и версионируемый паспорт согласований на Casper / Odra.

Сейчас готовы **Next.js frontend, FastAPI backend открытых данных, API-контракты и локальный mock перевозок**. Backend получает погоду Open-Meteo, активность IMF PortWatch и диспозиции Курык/ASCO без ключей. Прогноз задержек и операции Casper в mock — симуляция; вычисляемая модель и контракт в testnet ещё впереди.

| Файл | Назначение |
| --- | --- |
| [backend/README.md](backend/README.md) | Запуск реального API погоды и активности портов на 8000; стек, кэш, ошибки |
| [api/public-data.client.ts](api/public-data.client.ts) | Отдельный TypeScript-клиент реальных данных, без ключей |
| [docs/NEXT_STEPS.md](docs/NEXT_STEPS.md) | Проверка frontend, исправления интеграции и следующий этап с реальными данными |
| [docs/FRONTEND_TASK.md](docs/FRONTEND_TASK.md) | Самодостаточное задание Next.js-разработчику; можно переслать целиком |
| [docs/PLAN.md](docs/PLAN.md) | Объём MVP, распределение работы, этапы и критерии готовности |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Компоненты, прогноз, хранение, роли и контракт Odra |
| [docs/DATA_SOURCES.md](docs/DATA_SOURCES.md) | Проверенные источники и пробелы в данных |
| [data/ports.json](data/ports.json) | Покрытие портов России, Ирана, Казахстана, Азербайджана и Туркменистана |
| [api/openapi.json](api/openapi.json) | Источник истины для API v1, OpenAPI 3.1 |
| [api/types.ts](api/types.ts) | TypeScript DTO, сгенерированные из схем OpenAPI |
| [api/client.ts](api/client.ts) | Готовый fetch adapter для Next.js |
| [api/fixtures/shipment.json](api/fixtures/shipment.json) | Начальный ответ карточки груза |

Запуск mock API: Node.js 20+; npm-зависимостей нет.

```bash
node tools/mock-api.mjs
```

API: `http://localhost:4010/api/v1`. Проверка: `GET /health`, затем `GET /shipments/shp_demo_001`. Схема доступна на `http://localhost:4010/openapi.json`.

```bash
node --test tools/mock-api.test.mjs
```

Mock работает на localhost, хранит состояние в памяти, обслуживает одну общую демонстрационную сессию. Перезапуск сбрасывает данные. Для независимой работы запускайте отдельный экземпляр; `PORT=4011 node tools/mock-api.mjs`.

Передать фронтендеру лучше весь этот каталог либо архив, исключая будущие секреты и рабочие данные. Для старта достаточно `FRONTEND_TASK.md`, каталога `api` и `tools/mock-api.mjs`.

Frontend находится в `frontend/`. Установить зависимости: `cd frontend` и `bun install --frozen-lockfile`. Скопировать `.env.example` в `.env.local`, запустить `bun run dev`; mock API запустить отдельно из корня командой выше. Проверки frontend: `bun run lint`, `bun run build`.
