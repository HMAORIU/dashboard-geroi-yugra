# 📊 Дашборд "Герои Югры" — Анализ участников СВО

Интерактивный дашборд для анализа анкет участников специальной военной операции из ХМАО-Югра.  
Проект позволяет **загружать, анализировать и визуализировать данные** без отправки на сервер — всё работает в браузере.

---

## 🔍 Возможности

✅ **Полная автономность**  
— Все данные обрабатываются **локально**, ни один файл не покидает ваше устройство

✅ **Поддержка формата `.xlsx`**  
— Загружайте файлы напрямую (например, `анкеты.xlsx`)

✅ **Автоматическое определение полей**  
— Скрипт распознаёт технические имена колонок (например, `SURNAME`, `BIRTHDATE`, `MILITARYBRANCH`) и сопоставляет их с понятными категориями

✅ **10+ визуализаций**
- 📈 Образование (высшее / иное)
- 🌆 Распределение по городам
- ⚔️ Род войск
- 👥 Пол (мужчины / женщины)
- 🎖 Статус участия (действующий, ветеран)
- 💍 Семейное положение
- 🏆 Наличие государственных наград
- 📊 Управленческий опыт (по годам)
- 🏢 Воинские формирования
- 🧠 AI-анализ мотивационных писем через **Yandex GPT**

✅ **Поиск и фильтрация**
- По ФИО, городу, роду войск, должности

✅ **Экспорт данных**
- 💾 Экспорт в **Excel** (`Герои_Югры.xlsx`)
- 📄 Экспорт в **PDF** (всей страницы дашборда)

---

## 🚀 Демо

👉 [Открыть онлайн](https://hmaoriu.github.io/dashboard-geroi-yugra)

---

## 🛠 Как запустить

### 1. Подготовьте файлы

Убедитесь, что у вас есть:
- `анкеты.xlsx` или аналогичный файл с данными
- Папка `sample-data/` (опционально)

### 2. Загрузите файлы в репозиторий

Перейдите в:  
🔗 [https://github.com/HMAORIU/dashboard-geroi-yugra](https://github.com/HMAORIU/dashboard-geroi-yugra)

Нажмите **"Add file" → "Upload files"** и загрузите:

| Файл / Папка | Путь |
|-------------|------|
| `index.html` | в корень |
| `libs/xlsx.full.min.js` | в `libs/` |
| `assets/js/main.js` | в `assets/js/` |
| `sample-data/анкеты.xlsx` | в `sample-data/` (опционально) |

> ⚠️ Убедитесь, что `main.js` и `xlsx.full.min.js` лежат по указанным путям!

---

### 3. Включите GitHub Pages

1. Перейдите в **Settings → Pages**
2. В разделе **Source**:
   - Branch: `main`
   - Folder: `/root`
3. Нажмите **Save**

Через 1 минуту сайт станет доступен по ссылке:  
👉 `https://hmaoriu.github.io/dashboard-geroi-yugra`

---

## 🧠 Как использовать

1. Откройте сайт
2. Перетащите или кликните, чтобы загрузить файл `анкеты.xlsx`
3. Нажмите **"Обработать"**
4. Просмотрите:
   - Таблицу участников
   - Графики на вкладке **"Графики"**
   - AI-анализ мотиваций на вкладке **"AI-анализ"**

---

## 🤖 AI-анализ через Yandex GPT

Чтобы включить анализ мотивационных писем:

### 1. Создайте Cloudflare Worker (прокси)

> Чтобы не светить API-ключ напрямую.

Пример кода для Worker:
```js
export default {
  async fetch(request, env) {
    const { method } = request;
    if (method !== 'POST') return new Response('Method not allowed', { status: 405 });

    const body = await request.json();
    const { text } = body;

    const response = await fetch('https://llm.api.cloud.yandex.net/foundationModels/v1/completion', {
      method: 'POST',
      headers: {
        'Authorization': `Api-Key ваш_api_ключ`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        modelUri: `gpt://${ваш_cloud_id}/yandexgpt-lite`,
        messages: [
          { role: 'system', text: 'Проанализируй мотивации. Верни JSON: {categories: [{name, count}], top_ideas: ["..."]}' },
          { role: 'user', text }
        ],
        completionOptions: { temperature: 0.5, maxTokens: '500' }
      })
    });

    const data = await response.json();
    // Парсинг ответа GPT (пример упрощён)
    return new Response(JSON.stringify({ categories: [], top_ideas: [] }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
};