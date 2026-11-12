# TransitPassport простой контракт согласования перевозки

Rust-контракт реализован в `src/passport.rs`. Пять методов прошли 11 тестов в OdraVM и Casper Execution Engine; WASM собран. В testnet контракт пока не развёрнут, backend signer ещё не подключён.

## Сборка и тесты

Из корня репозитория:

```bash
cd contracts
cargo test --lib --locked
cargo odra schema
cargo odra build
cargo odra test -b casper
```

Нужны Cargo Odra (`cargo install cargo-odra --locked`), wasm-strip и wasm-opt. `rust-toolchain.toml` фиксирует nightly-2026-06-06 и wasm32 target: nightly требуется макросам Odra. Все Odra-зависимости согласованы на 2.10.1; точные зависимости сохранены в Cargo.lock. Проверен cargo-odra 0.1.7.

`.cargo/config.toml` разрешает импорт host-функций Casper при WASM linking и отключает расширения WASM, несовместимые с выбранным execution engine. Валидность результата проверена исполнением в Casper VM. Полученный файл: `wasm/TransitPassport.wasm`; он не хранится в Git и воспроизводится сборкой. ABI со всеми аргументами, типами и событиями: `resources/casper_contract_schemas/transit_passport_schema.json`.

В тестах контракт устанавливается с `InstallConfig::new::<TransitPassport>(false, false)`: без обновления и перезаписи package named key. Такие же флаги нужно явно передать при testnet deploy. Наличие готового WASM ещё не означает, что он установлен в сети с этими параметрами.

Проверены native events с содержимым actor/role, отсутствие прав у deployer, не являющегося участником, одно решение в версии, отзыв, граница expiry, повторное согласование с теми же hashes, история, изоляция отправок и ошибки ввода. Есть защитный checked_add версии; достижение u32::MAX не воспроизводилось миллиардами транзакций. Зависимость proc-macro-error2 выдаёт предупреждение о совместимости с будущими версиями Rust; на зафиксированном toolchain сборка и тесты проходят.

## Назначение

Контракт фиксирует, что три назначенных участника согласовали одну и ту же версию документов и маршрута. Для демонстрации достаточно одного контракта, нескольких отправок и трёх разных адресов, заданных при установке: logistician, carrier, clearance. Clearance — имитатор таможенного сервиса, не государственный орган.

Адреса неизменяемы. Создатель отправки не может назначить свою «таможню». Деплойер сам по себе не получает право подтверждать за участника. Привязку адресов к организациям обеспечивает настройка стенда; блокчейн не проверяет юридическую личность владельца ключа.

Ограничение сознательное: стенд моделирует одного логиста, одного перевозчика и один clearance service. Реестр организаций, динамические роли, деньги и токены для этого MVP не нужны.

## Пять методов

```text
create(shipment_id, documents_hash, route_hash)
revise(shipment_id, expected_version, documents_hash, route_hash)
attest(shipment_id, expected_version, approved, valid_until_ms)
revoke(shipment_id, expected_version)
get_passport(shipment_id, version)
```

`shipment_id`, `documents_hash`, `route_hash` — по 32 байта. ID — случайный публичный идентификатор, не номер контейнера. Хеши документов/маршрута — обязательные непустые commitments. Версии начинаются с 1. В getter version=0 означает текущую версию; положительное число — конкретную историческую. Getter возвращает header, текущую версию отправки, три решения, вычисленный status, evaluated_at_ms и ready_until_ms. Клиент проверяет, что запрошенная версия совпадает с current_version; старое согласование не является текущим разрешением.

| Метод | Кто вызывает | Правило |
| --- | --- | --- |
| create | Логист | Новый ID; создаёт v1 без автоматических подписей |
| revise | Логист | expected_version равен текущей; создаёт v+1, старую версию сохраняет |
| attest | Один из трёх участников | Caller определяет роль; одно решение на роль в текущей версии |
| revoke | Автор действующего approval | Отзывает только собственное approval текущей версии |
| get_passport | Любой читатель | Возвращает состояние указанной версии; данные публичны |

Протокол не принимает поле signer/role из backend как доказательство личности: право определяется `env().caller()`. Odra предоставляет caller и block time в contract environment. [Host communication](https://odra.dev/docs/2.9/basics/communicating-with-host/).

## Правила версий и решений

1. Во всех mutation, кроме create, проверяется текущая версия. Запоздалое подтверждение v1 после перехода к v2 отклоняется.
2. Роль принимает одно решение в версии. Повторное attest отклоняется, включая попытку изменить rejection на approval. Для исправления нужна новая версия и три новых подтверждения.
3. Approval требует `now < valid_until_ms <= now + 30 дней`. Reject требует `valid_until_ms=0`; он блокирует версию без автоматического истечения. Предел 30 дней — параметр нашего прототипа, не требование Casper или таможни.
4. Revoke ставит необратимый флаг у собственного approval; повторно подтвердить ту же версию нельзя. Отозвать чужое решение или снять rejection нельзя.
5. После expiry/revoke логист может создать новую версию даже с теми же hashes: это явное повторное согласование, а не продление подписи задним числом.
6. Старые headers/решения не переносятся и не удаляются при revise. Полная последовательность действий дополнительно видна в событиях.
7. `now == valid_until_ms` уже означает expiry. Источник времени — блок Casper в миллисекундах, не часы браузера и не дата демосценария. Единица подтверждается в [исходнике Odra ContractEnv 2.9.0](https://github.com/odradev/odra/blob/release/2.9.0/core/src/contract_env.rs).

Так не нужен отдельный nonce для повторных решений в одной версии: таких решений просто нет. Транзакция всё равно имеет сетевую подпись/TTL; backend хранит собственный idempotency key и transaction hash.

## Три состояния

```text
есть rejection текущей версии                         → blocked
три approval, все не отозваны, now < каждый valid_until → ready
иначе                                                 → collecting
```

`ready_until_ms` — минимальный valid_until трёх approval, только когда статус ready; иначе null. Статус вычисляется при чтении, а не хранится навечно как boolean. Для исторической версии это состояние её решений на evaluated_at_ms; пригодность текущей перевозки дополнительно требует `version == current_version`.

Таймер не создаёт транзакцию сам. Backend обновляет отображение по block time и перечитывает состояние перед использованием. Истёкшее approval остаётся в истории; его фактический статус на выбранном блоке вычисляется из timestamp.

Пользовательский текст ready: **«Комплект согласован»**. Это не таможенный выпуск, бронь места или доказательство физического прибытия груза.

## Хранение на Odra

```text
actors: три фиксированных Address
current_versions: Mapping<ShipmentId, u32>
versions: Mapping<(ShipmentId, u32), VersionHeader>
decisions: Mapping<(ShipmentId, u32, Role), Decision>
```

VersionHeader: documents_hash, route_hash, created_at_ms. Decision: approved, decided_at_ms, valid_until_ms, revoked_at_ms. Отсутствующая запись означает missing. Getter читает три роли за фиксированное число операций, без обхода всей истории.

Odra поддерживает tuple keys и custom serialized structs; для структуры используется `#[odra::odra_type]`. [Storage](https://odra.dev/docs/2.9/basics/storage-interaction/), [Mappings](https://odra.dev/docs/2.9/advanced/advanced-storage/).

Четыре события: PassportCreated, PassportRevised, Attested, ApprovalRevoked. В событии — ID, версия, actor/role, block time и существенные поля действия. Для Casper 2.x планируем native events; Odra поддерживает их вместе с CES. State остаётся источником истины, события помогают обновлять UI. [Events](https://odra.dev/docs/2.9/basics/events/).

## Документы и маршрут вне chain

PDF, инвойсы, ставки, координаты груза и названия компаний хранятся приватно на backend. На chain идут только commitments. Хеш не доказывает достоверность документа, но позволяет проверить неизменность предоставленного участникам содержимого.

Для межъязыковой воспроизводимости выбрать JCS по [RFC 8785](https://www.rfc-editor.org/rfc/rfc8785), готовую библиотеку и общие Python/TypeScript test vectors. Не использовать обычный JSON.stringify/json.dumps как неоговорённый формат подписи.

Предлагаемый commitment:

```text
SHA256(domain_prefix || shipment_id_32 || secret_salt_32 || JCS(manifest))
```

Domain отдельно для docs (`CF/DOCS/v1\0`) и route (`CF/ROUTE/v1\0`); соли отдельные. Манифест документов — отсортированный по ID список с kind и SHA-256 фактических байтов. Манифест маршрута — согласованный план: узлы, виды транспорта, выбранные окна/рейсы и версия формата. Использовать целые величины и явно заданные строки; формат и сортировку закрепить тестовыми векторами до интеграции. Соль и манифест доступны разрешённым проверяющим вне chain.

Новый прогноз ETA, публикация погоды или свежая диспозиция не создают версию паспорта. Версия меняется только после принятого изменения согласуемого плана/документов или явного повторного согласования. Иначе поток погодных обновлений постоянно сбрасывал бы подписи.

## Подпись и backend

MVP использует обычные подписанные Casper-транзакции от трёх demo-аккаунтов. Не добавляем отдельные off-chain signatures и relayer: Odra умеет их проверять, но они потребовали бы отдельного протокола payload/nonce/domain. [Signatures](https://odra.dev/docs/advanced/signatures/).

На стенде три ключа находятся в backend signer, переключение ролей разрешается сервером только как demo-функция. Это custody команды, а не три независимые организации. Для пилота подпись нужно передать участникам, сохранив те же entrypoints.

```text
Next.js → FastAPI → operation в БД → Rust Odra adapter → Casper testnet
                                   ← state/результат ←
```

Rust adapter — небольшой отдельный process/CLI с JSON-входом, без shell interpolation. Он сопоставляет actor с локальным key path, вызывает Livenet и возвращает transaction hash и результат. Закрытые ключи не передаются в JSON и не выводятся в логи. Контракт не делает HTTP-запросов к Open-Meteo/ASCO: результат анализа остаётся вне chain.

Operation flow: queued → submitted → confirmed/failed. После submit сохраняется hash; при timeout сначала сверка того же hash и state. Confirmed ставится после successful execution и проверки expected version/decision. Сбой БД после chain execution восстанавливается сверкой, не повторной подписью вслепую. Idempotency на backend не заменяет проверку версии в контракте.

Текущий frontend DTO уже подходит для трёх статусов и сроков. Нужно добавить revoke API/кнопку, отдавать старые attestations как invalidated относительно current_version и обновить текст «Готов к выпуску». Повторное attest той же роли в mock сейчас разрешено; до переключения на chain согласовать поведение mock с этим правилом.

## Реализация и проверка

Исследование опиралось на документацию Odra 2.9; при реализации выбрана согласованная доступная версия 2.10.1 и зафиксирован nightly toolchain. Реальная совместимость проверена локальной сборкой и execution-engine тестами, а не только примерами из документации.

Порядок: cargo odra scaffold → локальные OdraVM тесты → Casper execution-engine тесты → WASM → testnet → backend adapter. Для реальной сети Odra предлагает Livenet backend, отдельные key paths и chain name casper-test. Нужны testnet CSPR и доступный RPC; открытые данные без ключа не отменяют необходимость ключей для подписания chain-транзакций. [Testing](https://odra.dev/docs/2.9/basics/testing/), [Casper backend](https://odra.dev/docs/2.9/backends/casper/), [Livenet](https://odra.dev/docs/2.9/backends/livenet/).

Для MVP не планируем обновлять исполняемый код установленного контракта. При установке проверить InstallConfig/upgrade authority в выбранной версии Odra; отсутствие метода upgrade в нашем коде само по себе не доказывает неизменяемость package. До подтверждения настройки нельзя заявлять locked deployment. При исправлении прототипа можно развернуть новый контракт и явно указать новый address.

Матрица обязательных тестов:

- Три разных адреса обязательны; outsider/deployer без роли не подтверждает.
- Создание/пересмотр только логистом; duplicate ID и переполнение версии отклоняются.
- Три approval дают ready; два approval дают collecting; reject даёт blocked.
- Старая версия не принимает действия; revise не переносит решения.
- Второе attest отклоняется даже после revoke/expiry; исправление — новая версия.
- Revoke только свой, после него ready исчезает; rejection нельзя снять revoke.
- Граница valid_until, нулевой/слишком длинный срок, миллисекунды вместо секунд.
- Решения и хеши чужой отправки не влияют друг на друга.
- Время меняет вычисленный статус без новой транзакции; историческая версия не выдаётся как current.
- Правильные caller и native events проверяются в Casper VM, затем на testnet.
- Повтор HTTP-запроса, timeout RPC, failed execution и сбой записи БД не создают ложного confirmed.

Следующий конкретный шаг — testnet deploy с тремя разными demo-аккаунтами, фиксация адреса/транзакции и подключение Rust adapter к backend Operation flow. Реестр организаций и сложное управление участниками не входят в этот вариант.
