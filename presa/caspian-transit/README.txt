CASPIAN TRANSIT — презентация для защиты

Caspian-Transit.pdf — файл для показа, шрифты встроены.
Caspian-Transit.pptx — редактируемые слайды и заметки докладчика.
preview/overview.jpg — обзор всех 10 страниц.

Шрифты PPTX: Noto Sans Regular/Bold, Noto Serif Display Regular.
PDF не требует установки этих шрифтов.

Пересборка:
  python -m pip install -r requirements.txt
  python build_deck.py
  libreoffice --headless --convert-to pdf --outdir . Caspian-Transit.pptx
  python render_preview.py

Источники фактов и ограничения перечислены в заметках к каждому слайду.
Скриншоты сняты из текущего приложения 13.11.2026 без изменения отправок.
Карта: Natural Earth, public domain; геометрия и каталог скопированы
из проекта/API. Рисунок Monte Carlo — поясняющая схема, не результат рейса.
Метрики CatBoost: models/terminal-dwell/v2/README.md и report.json.
Исходные тексты и композиции находятся в build_deck.py.
