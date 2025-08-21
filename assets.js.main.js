// Глобальные переменные
let allData = [];
const defaultCols = {
  fio: ['fio', 'фио', 'user', 'имя', 'фамилия'],
  city: ['место', 'город', 'registration', 'адрес', 'проживание'],
  birth: ['дата', 'рождения', 'возраст', 'birthday'],
  docs: ['документ', 'загруз', 'подгруж', 'диплом', 'паспорт'],
  education: ['образован', 'учеб', 'edu', 'высшее'],
  branch: ['войск', 'подраздел', 'military', 'рота', 'батальон'],
  rank: ['звание', 'rank', 'лейтенант', 'сержант'],
  sector: ['сфера', 'деятел', 'activity', 'работа', 'профессия'],
  position: ['должн', 'position', 'работа', 'текущая'],
  motivation: ['мотив', 'цель', 'план', 'идея', 'развитие', 'причина'],
  injury: ['травм', 'ранен', 'здоров', 'контуз', 'диагноз'],
  telegram: ['телег', 'tg', 'telegram', 't.me']
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
    // Гарантируем срабатывание события при повторной загрузке
    fileInput.dispatchEvent(new Event('input'));
  }
});

dropZone.addEventListener('dragover', e => {
  e.preventDefault();
  dropZone.style.backgroundColor = '#cfe2ff';
});

dropZone.addEventListener('dragleave', () => {
  dropZone.style.backgroundColor = '#e9ecef';
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

    // Автоопределение колонок
    const headers = jsonData[0].map(h => String(h || '').toLowerCase());
    const cols = {};
    for (const [key, keywords] of Object.entries(defaultCols)) {
      cols[key] = headers.findIndex(h => keywords.some(k => h.includes(k)));
    }

    // Парсинг строк
    const parsed = jsonData.slice(1).map(row => {
      const item = {};
      Object.keys(cols).forEach(key => {
        const idx = cols[key];
        item[key] = idx >= 0 && row[idx] ? String(row[idx]).trim() : '';
      });
      item.raw = row;
      return item;
    }).filter(p => p.fio);

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

  const withDocs = data.filter(p => p.docs.toLowerCase().includes('да')).length;
  document.getElementById('withDocs').textContent = withDocs;

  const ages = data
    .filter(p => p.birth)
    .map(p => {
      const dob = new Date(p.birth);
      return new Date().getFullYear() - dob.getFullYear();
    })
    .filter(age => age > 15 && age < 80);
  const avgAge = ages.length ? (ages.reduce((a, b) => a + b, 0) / ages.length).toFixed(1) : '—';
  document.getElementById('avgAge').textContent = avgAge + ' лет';

  const highEdu = data.filter(p => p.education.toLowerCase().includes('высшее')).length;
  document.getElementById('highEdu').textContent = highEdu;

  // Таблица
  const tbody = document.getElementById('tableBody');
  tbody.innerHTML = '';
  data.forEach((p, i) => {
    const tr = document.createElement('tr');
    tr.className = 'participant-row';
    tr.innerHTML = `
      <td>${p.fio}</td>
      <td>${p.city}</td>
      <td>${ages[i] || '—'}</td>
      <td>${p.branch}</td>
      <td>${p.position}</td>
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

// AI-анализ через Yandex GPT (через безопасный прокси)
async function analyzeMotivations(data) {
  const container = document.getElementById('aiTagsContainer');
  container.innerHTML = '<p>🧠 Обработка через Yandex GPT...</p>';

  const texts = data