# Caspian API edge

`https://caspian.psychaos.art` — Cloudflare Worker custom domain. Worker передаёт
запросы через HTTPS на `psychaos.art:18443`; сертификат origin принадлежит
`psychaos.art`. На VPS отдельный nginx-сервер `/etc/nginx/conf.d/caspian-origin.conf`
на порту 18443 отправляет `/api/v1/`, `/docs`, `/redoc`, `/openapi.json` на backend
`127.0.0.1:18080`, остальные пути на frontend `127.0.0.1:18082`.

Два независимых SSH reverse tunnel доставляют запросы на компьютер: 18080 → backend
`127.0.0.1:8000`, 18082 → frontend Next.js `127.0.0.1:3100`. Для демо сейчас запущен
собранный frontend из ветки `frontend`. Это временное размещение: компьютер, оба сервиса,
SSH-соединения и Casper worker должны работать. Если SSH-соединение прервётся,
автоматический переподъём не настроен. Существующий туннель `127.0.0.1:22222`
и конфигурация Xray не менялись.

Локальный публичный порт VPS `18081` — старый HTTP-доступ для диагностики; не
передавайте через него токены. Для API используйте HTTPS-домен. Доступ браузера к API
с отдельного домена требует соответствующей настройки CORS на backend; роль и токен
лучше передавать через серверный proxy Next.js.

Обновить Worker при наличии авторизации Wrangler:

```bash
cd infra/caspian-edge
wrangler deploy --config wrangler.jsonc
```
