# Caspian API edge

`https://caspian.psychaos.art` — Cloudflare Worker custom domain. Worker передаёт
запросы через HTTPS на `psychaos.art:18443`; сертификат origin принадлежит
`psychaos.art`. На VPS отдельный nginx-сервер `/etc/nginx/conf.d/caspian-origin.conf`
на порту 18443 перенаправляет запросы в `127.0.0.1:18080`.

Далее SSH reverse tunnel доставляет запрос в backend `127.0.0.1:8000` на компьютере.
Это временное размещение: компьютер, backend, SSH-соединение и Casper worker должны
работать. Если SSH-соединение прервётся, автоматический переподъём не настроен.
Существующий туннель `127.0.0.1:22222` и конфигурация Xray не менялись.

Локальный публичный порт VPS `18081` — старый HTTP-доступ для диагностики; не
передавайте через него токены. Для API используйте HTTPS-домен. Доступ браузера к API
с отдельного домена требует соответствующей настройки CORS на backend; роль и токен
лучше передавать через серверный proxy Next.js.

Обновить Worker при наличии авторизации Wrangler:

```bash
cd infra/caspian-edge
wrangler deploy --config wrangler.jsonc
```
