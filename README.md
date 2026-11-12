# Caspian Flow

Пакет для старта хакатонного MVP по [case.md](case.md): прогноз риска пропустить судно, выбор маршрута и версионируемый паспорт согласований на Casper / Odra.

Сейчас готовы **план, архитектура, задание фронтендеру, API-контракт и локальный mock API**. Прогнозы и операции Casper в mock — симуляция. Рабочий backend, обученная модель, Next.js-приложение и контракт в testnet ещё предстоит реализовать.

| Файл | Назначение |
| --- | --- |
| [docs/FRONTEND_TASK.md](docs/FRONTEND_TASK.md) | Самодостаточное задание Next.js-разработчику; можно переслать целиком |
| [docs/PLAN.md](docs/PLAN.md) | Объём MVP, распределение работы, этапы и критерии готовности |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Компоненты, прогноз, хранение, роли и контракт Odra |
| [docs/DATA_SOURCES.md](docs/DATA_SOURCES.md) | Проверенные источники и пробелы в данных |
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
