"""Rebuild: python -m pip install python-pptx pillow qrcode; python build_deck.py.
Export PDF with LibreOffice. All text, diagrams, and geography are editable.
"""
from pathlib import Path
import json, math
import qrcode
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE, MSO_CONNECTOR
from pptx.enum.text import MSO_ANCHOR, PP_ALIGN
from pptx.oxml.xmlchemy import OxmlElement

ROOT = Path(__file__).resolve().parent
A = ROOT / 'assets'
W,H=13.333333,7.5
C={'ice':'EAF3F8','navy':'102E42','ink':'143C53','muted':'526E81','blue':'B7D9EB','pale':'D7E8F2','white':'FFFFFF','orange':'EF6A43','gold':'F6C684','teal':'2A8790','line':'C4D9E5','darkmuted':'A8C7D9','panel':'1C4056','mint':'C5E3DA'}
FONT='Noto Sans'; SERIF='Noto Serif Display'
P=Presentation(); P.slide_width=Inches(W); P.slide_height=Inches(H)
P.core_properties.title='Caspian Transit — предиктивная логистика Каспия'
P.core_properties.subject='Smart Caspian Transit · МТК Север–Юг · Hackathon MVP'
P.core_properties.author='Caspian Transit'
P.core_properties.keywords='Caspian, Casper, Odra, logistics, hackathon'

def remove_effects(sh):
 for ref in sh._element.xpath('.//a:effectRef'): ref.set('idx', '0')
 sppr=sh._element.find('{http://schemas.openxmlformats.org/presentationml/2006/main}spPr')
 if sppr is not None: sppr.append(OxmlElement('a:effectLst'))

def rgb(v): return RGBColor.from_string(C.get(v,v))
def rect(s,x,y,w,h,fill='white',stroke=None,radius=0):
 sh=s.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE if radius else MSO_SHAPE.RECTANGLE, Inches(x),Inches(y),Inches(w),Inches(h))
 sh.fill.solid(); sh.fill.fore_color.rgb=rgb(fill)
 if stroke: sh.line.color.rgb=rgb(stroke);sh.line.width=Pt(.75)
 else: sh.line.fill.background()
 remove_effects(sh)
 if radius:
  sh.adjustments[0]=radius/max(.001,min(w,h))
 return sh

def text(s,x,y,w,h,txt,size=18,color='ink',bold=False,font=FONT,align=None):
 sh=s.shapes.add_textbox(Inches(x),Inches(y),Inches(w),Inches(h));tf=sh.text_frame
 tf.clear();tf.word_wrap=True;tf.margin_left=tf.margin_right=tf.margin_top=tf.margin_bottom=0
 tf.vertical_anchor=MSO_ANCHOR.TOP
 for i,line in enumerate(txt.split('\n')):
  p=tf.paragraphs[0] if i==0 else tf.add_paragraph();p.text=line;p.font.name=font;p.font.size=Pt(size);p.font.bold=bold;p.font.color.rgb=rgb(color);p.space_before=Pt(0);p.space_after=Pt(3);p.line_spacing=1.13
  if align is not None:p.alignment=align
 return sh

def line(s,x1,y1,x2,y2,color='line',width=1,dash=False):
 sh=s.shapes.add_connector(MSO_CONNECTOR.STRAIGHT,Inches(x1),Inches(y1),Inches(x2),Inches(y2));remove_effects(sh);sh.line.color.rgb=rgb(color);sh.line.width=Pt(width)
 if dash:
  from pptx.enum.dml import MSO_LINE_DASH_STYLE
  sh.line.dash_style=MSO_LINE_DASH_STYLE.DASH
 return sh

def circle(s,x,y,d,fill='orange',stroke=None):
 sh=s.shapes.add_shape(MSO_SHAPE.OVAL,Inches(x),Inches(y),Inches(d),Inches(d));sh.fill.solid();sh.fill.fore_color.rgb=rgb(fill)
 if stroke:sh.line.color.rgb=rgb(stroke);sh.line.width=Pt(1)
 else:sh.line.fill.background()
 remove_effects(sh)
 return sh

def pill(s,x,y,w,label,dark=False,fill=None):
 rect(s,x,y,w,.35,fill or ('panel' if dark else 'pale'),radius=.12)
 text(s,x+.12,y+.065,w-.24,.23,label,10,'darkmuted' if dark else 'ink',True)

def base(n,label,dark=False):
 s=P.slides.add_slide(P.slide_layouts[6]);s.background.fill.solid();s.background.fill.fore_color.rgb=rgb('navy' if dark else 'ice')
 text(s,.58,.33,3,.25,'Caspian / Transit',12,'white' if dark else 'ink',True)
 text(s,8.6,.35,4.1,.25,label.upper(),10,'darkmuted' if dark else 'muted',align=PP_ALIGN.RIGHT)
 line(s,.6,7.05,12.73,7.05,'panel' if dark else 'line',.7)
 text(s,.6,7.16,8,.2,'SMART CASPIAN TRANSIT  /  МТК «СЕВЕР–ЮГ»',9,'darkmuted' if dark else 'muted')
 text(s,11.8,7.13,.9,.25,f'{n:02d} / 10',11,'darkmuted' if dark else 'muted',align=PP_ALIGN.RIGHT)
 return s

def heading(s,title,sub=None,dark=False):
 text(s,.6,.93,12.1,1.05,title,34,'white' if dark else 'ink',True)
 if sub:text(s,.63,2.03,11.9,.7,sub,17,'darkmuted' if dark else 'muted')

def note(s,txt):s.notes_slide.notes_text_frame.text=txt

def arrow(s,x,y,color='orange'):
 line(s,x,y,x+.34,y,color,1.8);line(s,x+.25,y-.08,x+.34,y,color,1.8);line(s,x+.25,y+.08,x+.34,y,color,1.8)

def image_contain(s,path,x,y,w,h):
 from PIL import Image
 with Image.open(path) as im: iw,ih=im.size
 scale=min(w/iw,h/ih);nw,nh=iw*scale,ih*scale
 return s.shapes.add_picture(str(path), Inches(x+(w-nw)/2),Inches(y+(h-nh)/2),width=Inches(nw),height=Inches(nh))

water=json.loads((A/'water.json').read_text())['geometry']['coordinates'][0]
ports=json.loads((A/'ports.json').read_text())['items']
route=json.loads((A/'route.json').read_text())['route']['geometry']['coordinates']

def map_shape(s,x,y,w,h,color='ink',route_color='orange',dots=True,labels=False):
 # Equirectangular projection with longitude corrected for Caspian latitude.
 xmin,xmax,ymin,ymax=46.5,55,36.4,47.3
 sc=min(w/((xmax-xmin)*.74),h/(ymax-ymin))
 ox=x+(w-(xmax-xmin)*.74*sc)/2;oy=y+(h-(ymax-ymin)*sc)/2
 def xy(lon,lat):return ox+(lon-xmin)*.74*sc,oy+(ymax-lat)*sc
 pts=[xy(*p) for p in water[::3]]
 b=s.shapes.build_freeform(Inches(pts[0][0]), Inches(pts[0][1])); b.add_line_segments([(Inches(a),Inches(c)) for a,c in pts[1:]],close=True);sh=b.convert_to_shape();sh.fill.solid();sh.fill.fore_color.rgb=rgb(color);sh.line.fill.background();remove_effects(sh)
 for p,q in zip(route,route[1:]):
  a,b=xy(*p);c,d=xy(*q);line(s,a,b,c,d,route_color,2.6)
 if dots:
  for p in ports:
   a,b=xy(p['coordinates']['longitude'],p['coordinates']['latitude']);circle(s,a-.035,b-.035,.07,'white',route_color)
 if labels:
  for id,dx,dy,tw in [('astrakhan',-.75,-.29,1.4),('makhachkala',-1.63,-.02,1.55),('kuryk',.15,-.04,.95),('alat',-1.05,.02,.9),('anzali',-.9,.13,1.0),('turkmenbashi',.12,-.05,1.65)]:
   p=next(v for v in ports if v['id']==id);a,b=xy(p['coordinates']['longitude'],p['coordinates']['latitude']);text(s,a+dx,b+dy,tw,.32,p['name'],11,'ink',True)
 return xy

# 01 / COVER
s=base(1,'Предиктивная логистика')
pill(s,.63,1.05,2.15,'HACKATHON  /  MVP')
text(s,.58,1.58,7.1,2.1,'Caspian\nTransit',68,'ink',font=SERIF)
text(s,.66,4.12,6.9,1.3,'Риск виден.\nРешение согласовано.',30,'ink',True)
text(s,.67,5.7,5.8,.85,'Маршруты, прогноз и цифровой паспорт\nгруза в едином окне логиста.',18,'muted')
rect(s,7.9,.9,4.83,5.85,'pale',radius=.23)
map_shape(s,8.15,1.05,4.4,5.5,'ink')
pill(s,8.17,6.12,2.45,'11 ПОРТОВ  /  5 СТРАН',fill='white')
note(s,'Открытие, 20 секунд. Caspian Transit помогает логисту видеть риск пропуска стыковки и согласовывать актуальную версию маршрута и документов. Это рабочий прототип по кейсу Smart Caspian Transit, а не действующая операторская платформа. На карте география Natural Earth и построенный приложением морской маршрут Курык—Алят. Портовые подходы не показаны. Источники: case.md, README.md, data/geography/caspian-water.geojson.')

# 02 / PROBLEM
s=base(2,'Проблема',True)
heading(s,'Одна задержка —\nвся цепочка ждёт.',dark=True)
text(s,.65,2.32,9.3,.5,'Груз должен успеть к следующему виду транспорта.',18,'darkmuted')
for x,num,title,desc in [( .65,'01','Ж/д или авто','Прибытие груза\nс отклонением от плана'),(4.9,'02','Порт','Обработка, документы\nи ожидание отправления'),(9.1,'03','Паром','Окно приёма закрыто —\nожидание следующего рейса')]:
 text(s,x,3.35,1,.6,num,32,'orange',True);text(s,x,4.2,3.5,.5,title,25,'white',True);text(s,x,4.95,3.5,.9,desc,17,'darkmuted')
arrow(s,4.05,4.46);arrow(s,8.3,4.46)
line(s,.65,6.22,12.68,6.22,'panel',1)
text(s,.65,6.4,11.8,.42,'Нужен прогноз стыковки и общий контекст для всех участников.',20,'gold')
note(s,'Проблема из case.md: рассинхронизация ж/д, авто и морского транспорта, погода и согласования. Не утверждаем измеренный экономический ущерб: нет фактических перевозок оператора. Сценарий в интерфейсе позволяет отдельно менять задержку ж/д или авто и наблюдать риск пропуска парома.')

# 03 / PRODUCT
s=base(3,'Рабочее приложение')
text(s,.6,.94,10.5,.7,'Весь маршрут. Одно рабочее окно.',31,'ink',True)
# Crisp screenshot with a roomy, asymmetric editorial rail.
rect(s,.6,1.92,9.42,4.92,'pale',radius=.15)
image_contain(s,A/'workspace.png',.72,2.02,9.18,4.72)
for y,n,title,desc in [(2.05,'01','Маршруты','Порты, направления\nи альтернативы'),(3.65,'02','Прогноз','Готовность, риск\nи время доставки'),(5.25,'03','Паспорт','Документы, версии\nи решения ролей')]:
 text(s,10.35,y,.6,.35,n,13,'teal',True);text(s,10.35,y+.32,2.45,.5,title,20,'ink',True);text(s,10.35,y+.87,2.4,.62,desc,13,'muted')
note(s,'Скриншот действующего сайта caspian.psychaos.art, снят при подготовке презентации. Открытая погода и сведения о портах реальные. Груз и условия перевозки сценарные. Карта строит 54 пары портов в обе стороны, исключая речную пару Астрахань—Оля. Геометрия проверена по маске воды, но не является судоводительским маршрутом. Не обещать реальное отслеживание груза или бронирование рейса.')

# 04 / DATA
s=base(4,'Открытые источники')
text(s,.6,.96,7.9,.7,'Каспий в данных',35,'ink',True)
text(s,.65,1.83,5.7,.6,'11 портов · 5 стран · без API-ключей',19,'muted')
map_shape(s,.95,2.6,5.4,3.95,'ink',labels=True)
for y,title,tag,body in [(2.15,'Open-Meteo','ПОГОДА','Ветер и порывы. Время прогноза\nи отметка устаревших данных.'),(3.56,'IMF PortWatch','АКТИВНОСТЬ','Исторические оценки судозаходов.\nНе фактическая очередь терминала.'),(4.97,'Курык / ASCO','ДИСПОЗИЦИИ','Опубликованные суда и статусы.\nДата и ссылка на первоисточник.')]:
 line(s,7.0,y-.15,12.68,y-.15,'line',.8);text(s,7,y,3.9,.4,title,23,'ink',True);text(s,10.95,y+.07,1.7,.25,tag,10,'teal',True,align=PP_ALIGN.RIGHT);text(s,7,y+.59,5.6,.72,body,17,'muted')
text(s,.65,6.65,11.9,.3,'Пропуск в источнике остаётся пропуском — интерфейс не подставляет вымышленные значения.',12,'muted')
note(s,'Россия, Казахстан, Азербайджан, Туркменистан и Иран. Покрытие источников различается. PortWatch содержит оценки судозаходов по AIS, а не загрузку причалов. Диспозиция не подтверждает свободные места или действующую бронь. Каталог портов берётся из API, карта из Natural Earth. Источники: docs/DATA_SOURCES.md, README.md, /api/v1/ports.')

# 05 / FORECAST
s=base(5,'Расчёт стыковки',True)
heading(s,'Успеет ли груз на рейс?', 'Считаем диапазон времени и вероятность пропуска стыковки.',True)
# schematic readiness distribution, deliberately labelled as schematic.
text(s,.65,3.05,7.4,.3,'СХЕМА РАСЧЁТА  /  НЕ РЕЗУЛЬТАТ ПЕРЕВОЗКИ',10,'darkmuted',True)
xs=[.85+i*.105 for i in range(64)]
for x in xs:
 h=.22+1.65*math.exp(-((x-4.0)/1.5)**2)
 rect(s,x,5.76-h,.064,h,'orange' if x>5.2 else 'blue',radius=.02)
line(s,.75,5.82,7.7,5.82,'darkmuted',.8)
line(s,5.2,3.53,5.2,6.05,'gold',1.6,True)
text(s,5.32,3.54,2.35,.7,'Закрытие\nприёма груза',13,'gold')
for x,t in [(2.2,'P10'),(3.85,'P50'),(5.7,'P90')]:text(s,x,6.1,.65,.3,t,12,'darkmuted')
for y,title,desc in [(3.03,'Monte Carlo','Множество вариантов\nдлительности этапов'),(4.25,'Риск стыковки','Доля сценариев, где груз\nне успевает к сроку приёма'),(5.47,'CO₂e по участкам','Масса × расстояние ×\nкоэффициент транспорта')]:
 text(s,8.55,y,3.8,.42,title,21,'white',True);text(s,8.55,y+.51,3.9,.75,desc,16,'darkmuted')
text(s,.65,6.64,11.8,.3,'Погода — открытые данные. Расписание, очередь, места и коэффициенты — условия сценария.',11,'darkmuted')
note(s,'Основной прогноз стыковки — прозрачный Monte Carlo. P10/P50/P90 — квантили распределения времени готовности. На рисунке условное распределение для объяснения метода, не реальный прогноз. Погода и история активности преобразуются в длительности по заданным сценарным правилам. Точность на каспийских грузах пока не подтверждена: событий оператора нет. ESG рассчитывается одинаково на API и фронте по массе, расстояниям и условным коэффициентам. Источники: backend/app/prediction.py, docs/ARCHITECTURE.md, README.md.')

# 06 / ML EVIDENCE
s=base(6,'Отдельный ML-эксперимент')
heading(s,'История операций улучшает прогноз', 'CatBoost: время от выгрузки контейнера до выезда из терминала.')
# Two bars, real experimental metrics from repo.
text(s,.7,2.94,6.8,.3,'СРЕДНЯЯ АБСОЛЮТНАЯ ОШИБКА  /  МЕНЬШЕ — ЛУЧШЕ',10,'muted',True)
for y,label,v,fill in [(3.65,'v1 · характеристики груза',48.62,'blue'),(4.85,'v2 · + история операций',32.10,'teal')]:
 text(s,.7,y,6.7,.4,label,17,'ink');rect(s,.7,y+.53,6.15*v/50,.24,fill,radius=.06);text(s,7.1,y+.32,1.4,.5,f'{v:.1f}'.replace('.',',')+' ч',23,'ink',True)
rect(s,9.05,2.94,3.62,3.03,'navy',radius=.18)
text(s,9.35,3.22,3.0,.95,'82,3%',42,'white',True)
text(s,9.35,4.35,2.95,1.2,'фактических значений\nпопало в интервал\nP10–P90',17,'darkmuted')
text(s,.7,6.3,12,.65,'14 542 случая · анонимизированный терминал · исследовательская проверка.\nКачество на Каспии не подтверждено. Эта модель не заменяет расчёт стыковки.',12,'muted')
note(s,'Источники: models/terminal-dwell/v2/README.md и report.json. CatBoost MultiQuantile: глубина 4, 92 дерева. 21 129 июльских случаев для обучения, отдельные августовские окна для выбора и калибровки. Сентябрьский период из 14 542 случаев ранее изучался, поэтому это исследовательское сравнение, не независимая финальная проверка. MAE v1 48.62 ч, v2 32.10 ч; покрытие P10–P90 82.3%, средняя ширина интервала 113 ч. Улучшение связано и с историей, и с калибровкой. API автоматически выбирает v2, затем v1, затем алгоритм при недостатке истории или недоступности моделей. Это отдельный endpoint /predictions/terminal-dwell, основной экран стыковки использует Monte Carlo.')

# 07 / CONTRACT
s=base(7,'Casper / Odra')
heading(s,'Согласована версия.\nИзменение требует нового решения.')
# Version lifecycle, 3 panels.
for x,num,title,lines in [( .65,'v1','Исходный комплект',['Хеш документов','Хеш маршрута','Решения трёх ролей']),(4.88,'Δ','Изменение',['Другой маршрут','или новый документ','→ новая версия']),(9.08,'v2','Новый комплект',['Новые хеши','Прежние решения не действуют','Нужны новые согласования'])]:
 rect(s,x,2.63,3.57,2.78,'white',radius=.17)
 text(s,x+.23,2.84,3.1,.6,num,31,'orange' if num=='Δ' else 'teal',True)
 text(s,x+.23,3.61,3.1,.4,title,19,'ink',True)
 text(s,x+.23,4.21,3.13,1.02,'\n'.join(lines),13,'muted')
arrow(s,4.34,3.93);arrow(s,8.54,3.93)
text(s,.67,5.85,6.8,.55,'Логист · Перевозчик · Таможня*',24,'ink',True)
text(s,.67,6.47,8.6,.4,'*Демонстрационная роль. Согласование не является таможенным выпуском.',11,'muted')
pill(s,9.08,5.9,3.57,'DEPLOYED  /  CASPER TESTNET',fill='mint')
text(s,9.08,6.4,3.6,.42,'Полные файлы — вне блокчейна.',12,'muted')
note(s,'TransitPassport реально развёрнут в Casper testnet. Контракт Rust/Odra хранит версии, хеши документов и маршрута, решения ролей, сроки действия и отзыв согласований. Полные файлы хранятся вне chain. Изменение прогноза само по себе не меняет паспорт. Worker подписывает транзакции на сервере, интерфейс ждёт confirmed и сверяет проекцию. Это прототип процесса pre-clearance, а не юридический таможенный выпуск. Назначенные адреса ролей отдельные, но управление ими демонстрационное. Источники: contracts/README.md, contracts/deployments/testnet.json. Контракт: https://testnet.cspr.live/contract/d84a3277dd3077e9afbf88464ead500cd163af4472528237987821dac77d3b4a')

# 08 / ARCHITECTURE
s=base(8,'Архитектура',True)
heading(s,'От карты — до подтверждения в сети', 'Разделяем расчёт, хранение и запись в блокчейн.',True)
# Flow at one clean level, auxiliary source and DB branches beneath.
for x,w,title,sub,fill in [(.65,2.25,'Интерфейс','Next.js / React','panel'),(3.48,2.53,'API','FastAPI / Python','panel'),(6.59,2.25,'Worker','Очередь операций','panel'),(9.42,3.25,'Casper','Rust / Odra · Testnet','teal')]:
 rect(s,x,3.04,w,1.35,fill,radius=.15);text(s,x+.2,3.27,w-.4,.43,title,23,'white',True);text(s,x+.2,3.89,w-.4,.3,sub,12,'darkmuted' if fill=='panel' else 'white')
for x in [3.01,6.13,8.96]:arrow(s,x,3.71,'gold')
line(s,4.74,4.42,4.74,4.93,'darkmuted',1)
rect(s,2.86,4.95,6.21,1.25,'panel',radius=.15)
text(s,3.1,5.18,2.35,.34,'SQLite + расчёт',18,'white',True)
text(s,5.72,5.16,3.12,.75,'Открытые источники\nMonte Carlo / CatBoost',15,'darkmuted')
text(s,.68,6.51,11.8,.35,'Новая версия появляется в интерфейсе после подтверждения транзакции.',18,'gold')
note(s,'Браузер → Next.js /api/backend → FastAPI /api/v1. SQLite хранит состояние и outbox. Worker отправляет и отслеживает транзакции, после confirmed применяется проверенная проекция. Прогноз Monte Carlo основной, CatBoost отдельный эксперимент. Backend не переносился на Rust — Rust используется в контракте. Демо обслуживается локальными systemd-службами через reverse SSH-туннель и VPS. Полностью независимый production-deploy и организационная авторизация остаются задачами пилота. Источники README.md, docs/ARCHITECTURE.md, infra/systemd/README.md.')

# 09 / DEMO
s=base(9,'Проверяем в приложении')
heading(s,'Один груз. Три решения.', 'Демо: от выбора маршрута до проверки паспорта в Casper.')
for y,num,title,body in [(2.9,'01','Выбрать','Открыть отправку и сравнить маршруты.'),(4.03,'02','Пересчитать','Включить шторм и увидеть изменение риска.'),(5.16,'03','Согласовать','Обновить паспорт и проверить хеши в сети.')]:
 circle(s,.65,y,.48,'ink');text(s,.65,y+.08,.48,.3,num,13,'white',True,align=PP_ALIGN.CENTER)
 text(s,1.35,y-.02,6.2,.45,title,24,'ink',True);text(s,1.35,y+.53,6.2,.5,body,17,'muted')
rect(s,8.25,2.71,4.43,3.89,'pale',radius=.17)
image_contain(s,A/'casper-proof.png',8.48,2.93,3.97,3.15)
text(s,8.5,6.25,3.94,.25,'СКРИНШОТ ПРОВЕРКИ ИЗ ПРИЛОЖЕНИЯ',9,'muted',True)
note(s,'Переход к живому демо. Основной сценарий 3–5 минут: открыть прогноз, сравнить условия, включить шторм, выбрать альтернативу с тем же назначением. Дождаться confirmed, затем поочерёдно согласовать версии от ролей. Показать ссылку на настоящий deploy в Casper Live. Замена invoice создаёт новую версию и делает прежние решения неактуальными. Не запускать изменение документов на основном стенде до готовности к показу. Время testnet непостоянно — на слайде предусмотрен скриншот настоящей сверки. Источник docs/NEXT_STEPS.md; подтверждённый прогон backend/evidence/case-flow-2026-11-13.json.')

# 10 / NEXT
s=base(10,'Рабочий MVP → пилот',True)
text(s,.62,1.02,9,1.75,'Видеть риск\nдо срыва стыковки.',42,'white',True)
text(s,.68,3.09,6.9,.8,'Прототип готов. Следующий шаг —\nпроверить его на перевозках оператора.',20,'darkmuted')
for y,n,title in [(4.46,'01','Подключить события груза и расписания'),(5.07,'02','Проверить качество прогноза на фактах'),(5.68,'03','Измерить эффект для логиста')]:
 text(s,.68,y,.4,.32,n,12,'orange',True);text(s,1.23,y-.03,6.8,.4,title,18,'white')
qr=qrcode.QRCode(box_size=12,border=2,error_correction=qrcode.constants.ERROR_CORRECT_M);qr.add_data('https://caspian.psychaos.art');qr.make(fit=True);qr.make_image(fill_color='#102E42',back_color='#EAF3F8').save(A/'demo-qr.png')
rect(s,9.03,1.1,3.64,4.86,'ice',radius=.2)
image_contain(s,A/'demo-qr.png',9.39,1.52,2.92,2.92)
text(s,9.36,4.62,3.0,.43,'Открыть демо',22,'ink',True,align=PP_ALIGN.CENTER)
link=text(s,8.73,6.23,4.25,.38,'caspian.psychaos.art',17,'gold',True,align=PP_ALIGN.RIGHT)
for p in link.text_frame.paragraphs:
 for run in p.runs:run.hyperlink.address='https://caspian.psychaos.art'
text(s,.68,6.56,7.1,.3,'Код: github.com/0himera/casp_iv',12,'darkmuted')
note(s,'Финал: приглашаем посмотреть работающий MVP и обсудить пилот с оператором. План: реальные события отправок, подтверждённые расписания, очередь и вместимость; проверка MAE готовности, покрытия интервалов, вероятности пропуска рейса; отдельный deploy и полноценная авторизация организаций. Не заявляем уже достигнутые проценты экономии или сокращения простоев. Демо: https://caspian.psychaos.art ; код: https://github.com/0himera/casp_iv .')

# Structural validation catches accidental off-slide objects before export.
for i,s in enumerate(P.slides,1):
 for sh in s.shapes:
  if sh.left < -Inches(.05) or sh.top < -Inches(.05) or sh.left+sh.width > P.slide_width+Inches(.05) or sh.top+sh.height > P.slide_height+Inches(.05):
   raise ValueError(f'Off-slide object at slide {i}: {sh.name}')
P.save(ROOT/'Caspian-Transit.pptx')
# Use the deck's gold for clickable text, including after a visit.
from zipfile import ZipFile, ZIP_DEFLATED
from lxml import etree
pptx_path=ROOT/'Caspian-Transit.pptx'
with ZipFile(pptx_path) as z: package={n:z.read(n) for n in z.namelist()}
for name, data in list(package.items()):
 if name.startswith('ppt/theme/') and name.endswith('.xml'):
  tree=etree.fromstring(data)
  for slot in tree.xpath('//a:clrScheme/a:hlink | //a:clrScheme/a:folHlink',namespaces={'a':'http://schemas.openxmlformats.org/drawingml/2006/main'}):
   for child in list(slot):slot.remove(child)
   color=OxmlElement('a:srgbClr');color.set('val',C['gold']);slot.append(color)
  package[name]=etree.tostring(tree,xml_declaration=True,encoding='UTF-8',standalone=True)
with ZipFile(pptx_path,'w',ZIP_DEFLATED) as z:
 for name,data in package.items():z.writestr(name,data)
print(f'Saved {len(P.slides)} editable slides to {ROOT}/Caspian-Transit.pptx')
