# Backend Casper: интеграция для Next.js

Обновление: `GET /corridors` возвращает восемь документированных связей или планируемых
направлений между портами пяти стран. Источники для каждой связи включены в ответ:
[коридор Алята](https://transit.gov.az/en/corridors/east-west-corridor),
[объявленная в 2021 линия Курык — Иран](https://portkuryk.kz/en/media/123/novayaparomnayaliniyanovievozmoznosti121),
[соглашение Курык — Махачкала](https://portkuryk.kz/en/media/930/quryq-porty-phef-2026-forumynda)
и [перечень UNECE](https://unece.org/sites/default/files/2023-10/ECE-TRANS-WP.24-153e%20.pdf).
Это география коридоров, не подтверждение актуального рейса или свободных мест.
У Курыка появились [координаты оператора](https://portkuryk.kz/ru/port/tarihy)
и работает запрос погоды; координаты Алята и Оли требуют дальнейшей проверки.

`POST /shipments/{id}/route-comparison` принимает тот же `PredictionRequest`, что и
`POST /predictions/readiness`, и проверяет, что все id маршрутов есть в карточке.
Возвращает id и revision отправки и сценарный forecast. Длительности, окна и наличие
мест задаёт вызывающая сторона; это не live-рекомендация. Расчёт не сохраняет результат
в карточку и не создаёт транзакцию. Неизвестная вместимость не превращается в бронь.
`POST /shipments/{id}/forecast` сохраняет сценарный Monte Carlo для всех маршрутов
карточки. Тело: `{ "expected_revision": 1, "scenario": PredictionRequest }`.
Нужны Bearer-токен логиста и Idempotency-Key. Ответ — обновлённый Shipment; revision
увеличивается, паспорт и его согласования не меняются. При pending операции сохранение
блокируется; stale revision даёт 409. После выбора другого маршрута его forecast
применяется при подтверждении операции Casper. Источники сценария не проверяются;
переданная пользователем вместимость остаётся сценарием, не реальной бронью.

`POST /shipments/{id}/emissions-comparison` считает `масса_т × км × кг_CO₂e/(т·км)`
для списка маршрутов и видов транспорта. Caller обязан передать расстояния, коэффициенты
и `factor_source`; результат обозначен `user_supplied_scenario`, не сертифицирован как
GLEC и не сохраняется. Одинаковые коэффициенты применяются ко всем сравниваемым маршрутам.

`POST /shipments/{id}/route-candidates` добавляет сценарный маршрут в существующую карточку.
Тело: `{ "expected_revision": 1, "route": Route }`, нужен токен логиста и Idempotency-Key.
Можно выбрать любые порты из `/ports`; геометрия, стоимость и остальные поля предоставляются
вызывающей стороной. Backend принудительно помечает геометрию как схематичную,
вместимость как синтетическую и сбрасывает ETA/риск. Это не проверка существования рейса.
После добавления нужно заново сохранить сценарный прогноз для всех вариантов, прежде чем
выбирать маршрут. Максимум 20 вариантов на отправку. Добавление варианта не меняет Casper;
сам выбор маршрута по-прежнему создаёт новую версию паспорта и требует подтверждений.

Клиенты: `corridors()`, `compareRoutes()`, `addRouteCandidate()`, `updateForecast()`,
`compareEmissions()`. Автопривязка live-параметров и подтверждённые расписания остальных
направлений ещё не реализованы. Каталог не претендует на все портовые терминалы Каспия.

`frontend/` не менялся. Backend: `http://localhost:8000/api/v1`.
Swagger: `http://localhost:8000/docs`. Постоянные отправки, документы, история версий
и операции TransitPassport работают с развёрнутым контрактом Casper testnet.

12.11.2026 полный HTTP-прогон создал отправку `shp_aa6da7b5570d40558753311ea265088e`
и получил три согласования: ready на момент проверки. [Хеши четырёх транзакций и
проверенное состояние](../backend/evidence/testnet-transit.json). Одобрения ограничены
24 часами; это снимок успешного прогона, текущий статус читать через API.

## Задача фронтендеру

Использовать [api/transit.client.ts](../api/transit.client.ts) и типы из
[api/public-data.types.ts](../api/public-data.types.ts). Полная схема backend:
[api/public-data.openapi.json](../api/public-data.openapi.json).
Старый `api/openapi.json` описывает отдельный mock на 4010 и остаётся для его тестов.

Формы Shipment, списка, существующих запросов и Operation сохранены. Дополнения:
operation kind `create` / `revoke`; до регистрации в chain `passport.version=0`, пустые
commitment hashes и отсутствие согласований. ID выдаётся сервером; `shp_demo_001`
существует только в mock. Получать актуальный ID из `GET /shipments`.

Роли REST: `logistician`, `carrier`, `customs`. Последняя соответствует `clearance`
контракта. Старые `demo-*` токены настоящий backend не принимает. Действующие токены
текущего testnet-preview размещены в [api/preview-role-tokens.json](../api/preview-role-tokens.json).
Они намеренно опубликованы в репозитории и дают доступ к операциям демо; это не токены
для production. В Next.js передавать их через server-only env и proxy. PEM фронтенду не нужны.
Выбор роли в демо демонстрирует участников; пользовательская авторизация и подпись
пользовательским кошельком пока не реализованы.

```ts
// Серверный обработчик Next.js; roleToken берётся из server-only env.
const api = createTransitClient(process.env.CASPIAN_API_URL, roleToken);
const operation = await api.attest(shipment.id, {
  decision: 'approved', expected_revision: shipment.revision,
}, crypto.randomUUID());
```

Один клик = один `Idempotency-Key`. При сетевом повторе сохранять тот же ключ **и тело**,
включая expected_revision. Новое действие получает новый ключ.

| Запрос | Назначение |
| --- | --- |
| `GET /shipments` | Список сохранённых отправок; до создания пустой |
| `POST /shipments` | Логист создаёт демо: `{"template":"demo"}`; необязательный title |
| `GET /shipments/{id}` | Карточка и pending_operation_id |
| `POST /shipments/{id}/route-selection` | `{route_id, forecast_id, expected_revision}` |
| `POST /shipments/{id}/document-revisions` | `{document_id, filename, content_base64, expected_revision}`; до 1 MiB байт |
| `POST /shipments/{id}/attestations` | `{decision:"approved"|"rejected", expected_revision}` |
| `POST /shipments/{id}/revocations` | `{expected_revision}`; отзыв своего активного согласования |
| `GET /operations/{id}` | Poll до confirmed / failed |
| `GET /shipments/{id}/passport-state` | Прямое чтение Casper, block hash и state root; может занять десятки секунд |
| `GET /shipments/{id}/versions/{version}` | Авторизованное чтение исторической карточки и commitment proof |
| `GET /shipments/{id}/documents/{document_id}/versions/{version}` | Авторизованное скачивание подтверждённых байт |

Все POST требуют `Authorization: Bearer …`, `Idempotency-Key`, JSON. Ответ **202** означает
принятие операции. Блокировать действия при pending_operation_id, poll раз в 2–5 секунд,
после confirmed перечитать карточку. result_revision — ревизия применённой операции;
карточка может иметь более новую после внешнего согласования.

queued — ждёт worker; submitted — подписанный deploy сохранён, отправляется или ожидает
исполнения; confirmed — успешный receipt и проверка состояния Casper; failed — известная
ошибка до отправки либо исполнения. Хеш/ссылка доступны с submitted. submitted с
RECONCILIATION_REQUIRED требует разбора оператором: показывать ссылку, не создавать
новую операцию автоматически.

409 REVISION_CONFLICT, OPERATION_PENDING, FORECAST_STALE, ALREADY_ATTESTED,
IDEMPOTENCY_CONFLICT показывать отдельно. При конфликте ревизии перечитать карточку,
не повторять действие автоматически с новой ревизией. 503 CHAIN_STATE_STALE — worker
должен обновить состояние; 503 WRITES_DISABLED — запись выключена.

revision отправки и passport.version различаются. Согласование увеличивает revision;
документ/маршрут создаёт следующую версию паспорта, старые согласования invalidated.
Одна роль принимает одно решение на версию. Одобрение действует 24 часа; отказ блокирует
версию без срока. После отзыва/истечения повторное согласование той же версии невозможно.

Карточка — сохранённая проекция. Worker перечитывает Casper примерно раз в минуту.
При возрасте chain snapshot больше пяти минут или ошибке синхронизации источник Casper
помечается stale, allowed_actions=[] и запись блокируется. Истечение считается и при GET.
Для прямой проверки служит passport-state; недоступный RPC возвращает 503.

Нужно сделать на фронте: server proxy с токенами, base URL, получение ID из списка,
pending/poll/error UI, метки качества. Изменение дизайна и карт для этого не требуется.

## Границы текущей версии

POST /shipments создаёт только явно выбранный demo template. Груз, маршруты, цены,
прогноз условные, data_mode=synthetic; документы содержат сохраняемые демо-байты.
Подписи, транзакции и паспорт — настоящие testnet. Fixture-прогноз разрешает выбор
маршрута в течение 24 часов демонстрации; это не live-модель.
Monte Carlo `/predictions/readiness` отдельно и карточку автоматически не изменяет.
`/demo/scenarios` есть только в mock и не рекламируется в allowed_actions настоящего API.
Свободное создание производственных грузов и связывание прогнозов — следующий этап.

## Запуск и архитектура

`Next.js → FastAPI → SQLite outbox → Python worker → casper-client → Casper`.
backend/var/transit.sqlite3 содержит карточки, версии, байты документов, proofs и
подписанные deploy. Кэш публичных источников — отдельная БД. Один worker удерживает
file lock; SQLite-транзакции сериализуют команды. Нужен один хост с постоянным диском;
несколько worker/реплик и stateless filesystem этим вариантом не поддержаны.

```bash
cd backend
uv sync --locked
# Настроить .env по .env.example: запись, три случайных токена и пути PEM.
# casper-client 5.0.1 должен быть в PATH.
uv run --env-file .env uvicorn app.main:app --host 127.0.0.1 --port 8000
# Во втором терминале, та же БД и конфигурация:
uv run --env-file .env python -m app.worker
```

Конфигурация текущей машины: исключённый из Git `contracts/.local/backend.env`, который
можно передать обоим процессам. В нём ссылки на существующие ключи; ключи не копировались.
API не подписывает и не отправляет транзакции при старте или GET.

До отправки worker атомарно сохраняет полный подписанный deploy и известный хеш.
После перезапуска проверяет этот хеш и повторяет те же байты при необходимости;
новую подпись после тайм-аута не создаёт. confirmed требует успешный receipt,
совпадение версии/обоих хешей и ожидаемого решения/отзыва. Новые байты документов
публикуются только после подтверждения. Неизвестное состояние или истечение TTL
неподтверждённого deploy оставляет операцию pending для ручного разбора.

Commitment: SHA-256 от domain prefix `CF/DOCUMENTS/v1\0` / `CF/ROUTE/v1\0`, 32 байт
случайного chain shipment ID, 32 байт соли и RFC 8785 JSON manifest. Отдельные соли
документов/маршрута хранятся локально, повторно используются внутри отправки.
Документы отсортированы по ID; manifest содержит ID, kind, version, SHA-256 байт.
Маршрут: ID, ports, modes, geometry, geometry_kind. Прогноз/ETA/цена не входят в согласование.

Полная проверка через HTTP (явно отправляет testnet-транзакции):

```bash
uv run --env-file ../contracts/.local/backend.env python scripts/smoke_transit.py
```

Журнал backend/var/smoke-transit.json позволяет продолжить тот же запуск. Smoke создаёт
паспорт, получает три согласования и сверяет готовность/хеши прямым чтением Casper.
Локальные тесты CSPR не тратят. Разделение make/send-deploy и проверка исполнения:
[документация Casper](https://docs.casper.network/1.5.X/developers/cli/sending-deploys).
Legacy deploy выбран по фактической совместимости текущего testnet RPC.
