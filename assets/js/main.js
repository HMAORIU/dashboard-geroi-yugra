// Глобальные переменные
let allData = [];

// Сопоставление технических полей из анкеты
const fieldMap = {
  lastName: ['UF_SURNAME'],
  firstName: ['UF_FIRSTNAME'],
  middleName: ['UF_PATRONYMIC'],
  birth: ['UF_BIRTHDATE'],
  city: ['UF_PLACEOFREGISTRATIONVALUE'],
  docs: ['UF_PASSPORTSERIESNUMBER'],
  education: ['UF_EDUCATIONVALUE'],
  branch: ['UF_MILITARYBRANCH'],
  rank: ['UF_RANKNAME'],
  sector: ['UF_FIELDOFWORKVALUE'],
  position: ['UF_CURRENTPOSITION'],
  motivation: ['UF_PARTICIPATEPROJECTVALUE'],
  injury: ['UF_INFORMATIONINJURIES'],
  telegram: ['UF_LINKTELEGRAM'],
  email: ['UF_ALTERNATIVECONTACTMY'],
  user_id: ['UF_USER'],
  status: ['UF_PARTICIPATIONSTATUS'],
  formation: ['UF_MILITARYFORMATION'],
  military_position: ['UF_COMMANDMILITARYPOSITIONVALUE'],
  contact: ['UF_CONTACTINFO'],
  work_before: ['UF_WORKBEFORE'],
  current_work: ['UF_CURRENTPLACEOFWORK'],
  experience: ['UF_PERIODMANAGEMENTEXPERIENCEVALUE'],
  ideas: ['UF_WHATDEVELOPMENTUGRA']
};

// Элементы DOM
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const processBtn = document.getElementById('processBtn');
const progressContainer = document.getElementById('progressContainer');
const progressBar = document.getElementById('progressBar');

// Drag & Drop
dropZone.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', function () {
  if (this.files.length > 0) {
    dropZone.classList.add('success');
    processBtn.disabled = false;
    fileInput.dispatchEvent(new Event('input'));
  }
});

['dragover', 'dragenter'].forEach(evt => {
  dropZone.addEventListener(evt, e => {
    e.preventDefault();
    dropZone.style.backgroundColor = '#cfe2ff';
  }, false);
});

['dragleave', 'dragend'].forEach(evt => {
  dropZone.addEventListener(evt, () => {
    dropZone.style.backgroundColor = '#e9ecef';
  }, false);
});

dropZone.addEventListener('drop', e => {
  e.preventDefault();
  dropZone.style.backgroundColor = '#e9ecef';
  if (e.dataTransfer.files.length > 0) {
    fileInput.files = e.dataTransfer.files;
    dropZone.classList.add('success');
    processBtn.disabled = false;
    fileInput.dispatchEvent(new Event('input'));
  }
});

// Обработка файла
processBtn.addEventListener('click', () => {
  const file = fileInput.files[0];
  if (!file) return;

  progressContainer.style.display = 'block';
  progressBar.style.width = '20%';

  setTimeout(() => { progressBar.style.width = '50%'; }, 300);
  setTimeout(() => { progressBar.style.width = '80%'; }, 600);

  const reader = new FileReader();
  reader.onload = function(e) {
    setTimeout(() => { progressBar.style.width = '100%'; }, 800);

    const binaryStr = e.target.result;
    const workbook = XLSX.read(binaryStr, { type: 'binary' });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    if (jsonData.length < 2) {
      alert("Файл пустой или не содержит данных.");
      return;
    }

    // Заголовки (первая строка)
    const headers = jsonData[0];

    // Поиск индексов по техническим именам
    const cols = {};
    for (const [key, possibleNames] of Object.entries(fieldMap)) {
      cols[key] = headers.findIndex(h => possibleNames.includes(String(h).trim()));
    }

    // Парсинг строк
    const parsed = jsonData.slice(1).map(row => {
      const item = {};
      Object.keys(cols).forEach(key => {
        const idx = cols[key];
        if (idx >= 0 && row[idx]) {
          let val = String(row[idx]).trim();
          // Очистка от [1], [2], ссылок и т.д.
          val = val
            .replace(/\[\d+\]/g, '')
            .replace(/https?:\/\/[^\s]+/g, '')
            .replace(/\|+/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
          item[key] = val;
        } else {
          item[key] = '';
        }
      });

      // Объединение ФИО
      item.fio = [item.lastName, item.firstName, item.middleName]
        .filter(Boolean).join(' ').trim() || item.lastName || '—';

      // Извлечение города из "г. Сургут"
      if (item.city) {
        const match = item.city.match(/г\.\s*([^,\n]+)/i);
        item.city = match ? match[1].trim() : item.city.split(',')[0].trim();
      }

      // Вычисление возраста
      if (item.birth && item.birth.includes('.')) {
        const year = parseInt(item.birth.split('.')[2]);
        if (year > 1900) {
          item.age = new Date().getFullYear() - year;
        }
      }

      return item;
    }).filter(p => p.fio !== '—' && p.fio);

    allData = parsed;
    localStorage.setItem('heroData', JSON.stringify(allData));

    setTimeout(() => {
      renderDashboard(allData);
    }, 1000);
  };
  reader.readAsBinaryString(file);
});

// Загрузка из localStorage
window.onload = () => {
  const saved = localStorage.getItem('heroData');
  if (saved) {
    try {
      allData = JSON.parse(saved);
      renderDashboard(allData);
      if (document.getElementById('dropZone')) {
        document.getElementById('dropZone').classList.add('success');
        document.getElementById('processBtn').disabled = false;
      }
    } catch (e) {
      console.warn("Не удалось загрузить данные из localStorage", e);
    }
  }
};

// Отрисовка дашборда
function renderDashboard(data) {
  progressContainer.style.display = 'none';
  document.getElementById('dashboard').style.display = 'block';

  const total = data.length;
  document.getElementById('total').textContent = total;

  const withDocs = data.filter(p => p.docs).length;
  document.getElementById('withDocs').textContent = withDocs;

  const avgAge = data.filter(p => p.age).length
    ? (data.filter(p => p.age).reduce((a, b) => a + b.age, 0) / data.filter(p => p.age).length).toFixed(1)
    : '—';
  document.getElementById('avgAge').textContent = avgAge + ' лет';

  const highEdu = data.filter(p => p.education.toLowerCase().includes('высшее')).length;
  document.getElementById('highEdu').textContent = highEdu;

  // Таблица
  const tbody = document.getElementById('tableBody');
  tbody.innerHTML = '';
  data.forEach(p => {
    const tr = document.createElement('tr');
    tr.className = 'participant-row';
    tr.innerHTML = `
      <td>${p.fio}</td>
      <td>${p.city || '—'}</td>
      <td>${p.age || '—'}</td>
      <td>${p.branch || '—'}</td>
      <td>${p.position || '—'}</td>
    `;
    tr.onclick = () => showDetail(p);
    tbody.appendChild(tr);
  });

  // Поиск
  document.querySelectorAll('#searchFio, #searchCity, #searchBranch, #searchPosition').forEach(input => {
    input.addEventListener('input', filterTable);
  });

  function filterTable() {
    const fio = document.getElementById('searchFio').value.toLowerCase();
    const city = document.getElementById('searchCity').value.toLowerCase();
    const branch = document.getElementById('searchBranch').value.toLowerCase();
    const pos = document.getElementById('searchPosition').value.toLowerCase();

    Array.from(tbody.children).forEach(tr => {
      const text = tr.textContent.toLowerCase();
      const match = (!fio || text.includes(fio)) &&
                    (!city || text.includes(city)) &&
                    (!branch || text.includes(branch)) &&
                    (!pos || text.includes(pos));
      tr.style.display = match ? '' : 'none';
    });
  }

  // Графики
  updateChart('docsChart', 'pie', ['С документами', 'Без'], [withDocs, total - withDocs], ['#5CB85C', '#D9534F']);
  updateChart('eduChart', 'doughnut', ['Высшее', 'Другое'], [highEdu, total - highEdu], ['#337AB7', '#F0AD4E']);

  const cities = count(data, 'city');
  updateChart('citiesChart', 'bar', Object.keys(cities), Object.values(cities), ['#1976D2']);

  const branches = count(data, 'branch');
  updateChart('branchChart', 'pie', Object.keys(branches), Object.values(branches), ['#D32F2F', '#1976D2', '#0288D1', '#388E3C']);

  // AI-анализ
  analyzeMotivations(data);
}

// Универсальный график
function updateChart(id, type, labels, data, colors) {
  const ctx = document.getElementById(id);
  if (ctx.chart) ctx.chart.destroy();
  new Chart(ctx, {
    type: type,
    data: {
      labels: labels,
      datasets: [{ data: data, backgroundColor: colors }]
    },
    options: { responsive: true }
  });
}

// Подсчёт значений
function count(arr, key) {
  const map = {};
  arr.forEach(p => {
    if (p[key]) {
      const clean = p[key].replace(/\[\d+\]/g, '').trim();
      map[clean] = (map[clean] || 0) + 1;
    }
  });
  return map;
}

// AI-анализ через Yandex GPT
async function analyzeMotivations(data) {
  const container = document.getElementById('aiTagsContainer');
  container.innerHTML = '<p>🧠 Обработка через Yandex GPT...</p>';

  const texts = data
    .filter(p => p.motivation && p.motivation.length > 20)
    .map(p => p.motivation)
    .slice(0, 10)
    .join("\n\n---\n\n");

  if (!texts.trim()) {
    container.innerHTML = '<p>Нет данных для анализа.</p>';
    return;
  }

  try {
    const response = await fetch('https://yandex-gpt-proxy.your-domain.workers.dev/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: texts })
    });

    const result = await response.json();

    const tagsHtml = result.categories
      .sort((a, b) => b.count - a.count)
      .map(cat => `
        <span class="tag" style="font-size:${100 + cat.count * 10}%">
          <span class="ai-category">${cat.name}</span> (${cat.count})
        </span>
      `).join('');
    container.innerHTML = tagsHtml;

    const ideasList = document.getElementById('aiIdeasList');
    ideasList.innerHTML = '';
    result.top_ideas?.forEach(idea => {
      const li = document.createElement('li');
      li.textContent = idea;
      ideasList.appendChild(li);
    });

  } catch (error) {
    console.error("Ошибка Yandex GPT:", error);
    container.innerHTML = `<p>❌ Ошибка AI: ${error.message}</p>`;
  }
}

// Детализация участника
function showDetail(p) {
  const modal = new bootstrap.Modal(document.getElementById('detailModal'));
  document.getElementById('modalTitle').textContent = p.fio;
  document.getElementById('modalBody').innerHTML = `
    <p><strong>Город:</strong> ${p.city || '—'}</p>
    <p><strong>Дата рождения:</strong> ${p.birth || '—'}</p>
    <p><strong>Род войск:</strong> ${p.branch || '—'}</p>
    <p><strong>Звание:</strong> ${p.rank || '—'}</p>
    <p><strong>Должность:</strong> ${p.position || '—'}</p>
    <p><strong>Сфера деятельности:</strong> ${p.sector || '—'}</p>
    <p><strong>Мотивация:</strong> ${p.motivation || '—'}</p>
    <p><strong>Травмы:</strong> ${p.injury || '—'}</p>
    <p><strong>Telegram:</strong> ${p.telegram || '—'}</p>
    <p><strong>Email:</strong> ${p.email || '—'}</p>
  `;
  modal.show();
}

// Экспорт в Excel
document.getElementById('exportExcel').addEventListener('click', () => {
  const ws = XLSX.utils.json_to_sheet(allData.map(p => ({
    ФИО: p.fio,
    Город: p.city,
    Возраст: p.age,
    "Род войск": p.branch,
    Должность: p.position,
    Мотивация: p.motivation
  })));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Участники");
  XLSX.writeFile(wb, "Герои_Югры.xlsx");
});

// Экспорт в PDF
document.getElementById('exportPdf').addEventListener('click', () => {
  html2canvas(document.querySelector("#dashboard")).then(canvas => {
    const imgData = canvas.toDataURL('image/png');
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('p', 'mm', 'a4');
    const width = pdf.internal.pageSize.getWidth();
    const height = (canvas.height * width) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, width, height);
    pdf.save('Герои_Югры.pdf');
  });
});