import { distanceKm, mapUrl } from './distance.js';

// Public Nominatim is for light use. Change this URL to switch providers.
const SEARCH_ENDPOINT = 'https://nominatim.openstreetmap.org/search';
const selected = { origin: null, destination: null };
const cache = new Map();
let busy = false;
let lastRequest = 0;
const fields = document.querySelector('#fields');
const calculate = document.querySelector('#calculate');
const result = document.querySelector('#result');
const hint = document.querySelector('#hint');

function resetResult() {
  result.hidden = true;
  calculate.disabled = !selected.origin || !selected.destination;
  hint.textContent = calculate.disabled ? '검색 결과에서 출발지와 도착지를 선택해 주세요.' : '두 장소가 선택되었어요. 거리를 계산해 보세요.';
}

function readCache(key) {
  if (cache.has(key)) return cache.get(key);
  try {
    const item = JSON.parse(localStorage.getItem(`sai:${key}`));
    if (item && Date.now() - item.time < 86400000 && Array.isArray(item.data)) return item.data;
  } catch { /* Storage is optional. */ }
  return null;
}

for (const [id, label, placeholder] of [['origin', '출발지', '예: 서울역, 경복궁'], ['destination', '도착지', '예: 부산역, 해운대해수욕장']]) {
  const form = document.createElement('form');
  form.className = `field ${id}`;
  form.innerHTML = `<label for="${id}"><span class="dot"></span>${label}</label><div class="input-row"><input id="${id}" maxlength="200" placeholder="${placeholder}" autocomplete="off" required aria-describedby="${id}-status"><button class="search" type="submit">검색</button></div><p class="status" id="${id}-status" role="status"></p><ul class="results" aria-label="${label} 검색 결과"></ul>`;
  fields.append(form);
  const input = form.querySelector('input');
  const status = form.querySelector('.status');
  const list = form.querySelector('.results');
  let version = 0;
  input.addEventListener('input', () => {
    version++;
    selected[id] = null;
    list.replaceChildren();
    status.textContent = '';
    resetResult();
  });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const query = input.value.trim();
    if (!query || busy) return;
    const current = ++version;
    selected[id] = null;
    resetResult();
    list.replaceChildren();
    status.textContent = '장소를 찾고 있어요…';
    busy = true;
    document.querySelectorAll('.search, #swap').forEach(button => button.disabled = true);
    try {
      let places = readCache(query);
      if (!places) {
        // Space all requests on this page, including searches in the other field.
        await new Promise(resolve => setTimeout(resolve, Math.max(0, 1100 - (Date.now() - lastRequest))));
        const url = new URL(SEARCH_ENDPOINT);
        url.search = new URLSearchParams({ q: query, format: 'jsonv2', limit: '5', 'accept-language': 'ko', addressdetails: '1' });
        lastRequest = Date.now();
        const response = await fetch(url, { signal: AbortSignal.timeout(15000), referrerPolicy: 'strict-origin-when-cross-origin' });
        if (!response.ok) throw new Error(response.status === 429 ? '검색 요청이 많아요. 잠시 후 다시 시도해 주세요.' : '장소 검색 서비스에 연결할 수 없어요. 잠시 후 다시 시도해 주세요.');
        const data = await response.json();
        if (!Array.isArray(data)) throw new Error('검색 결과를 읽을 수 없어요. 다시 시도해 주세요.');
        places = data.filter(place => typeof place.display_name === 'string' && Number.isFinite(Number(place.lat)) && Number.isFinite(Number(place.lon)) && Math.abs(Number(place.lat)) <= 90 && Math.abs(Number(place.lon)) <= 180);
        cache.set(query, places);
        try { localStorage.setItem(`sai:${query}`, JSON.stringify({ time: Date.now(), data: places })); } catch { /* Storage is optional. */ }
      }
      if (version !== current) return;
      status.textContent = places.length ? `${places.length}개의 장소를 찾았어요. 정확한 장소를 선택해 주세요.` : '검색 결과가 없어요. 지역명이나 다른 장소명으로 검색해 주세요.';
      for (const place of places) {
        const li = document.createElement('li');
        const button = document.createElement('button');
        button.type = 'button';
        const title = document.createElement('strong');
        title.textContent = place.name || place.display_name.split(',')[0];
        const address = document.createElement('small');
        address.textContent = place.display_name;
        button.append(title, address);
        button.addEventListener('click', () => {
          selected[id] = { lat: Number(place.lat), lon: Number(place.lon), name: title.textContent, address: place.display_name };
          input.value = title.textContent;
          status.textContent = `선택됨 · ${place.display_name}`;
          list.replaceChildren();
          resetResult();
        });
        li.append(button);
        list.append(li);
      }
    } catch (error) {
      if (version === current) status.textContent = ['TimeoutError', 'AbortError'].includes(error.name) ? '검색 시간이 초과되었어요. 다시 시도해 주세요.' : error instanceof TypeError ? '네트워크 연결을 확인하고 다시 검색해 주세요.' : error.message;
    } finally {
      busy = false;
      document.querySelectorAll('.search, #swap').forEach(button => button.disabled = false);
    }
  });
}

document.querySelector('#swap').addEventListener('click', () => {
  [selected.origin, selected.destination] = [selected.destination, selected.origin];
  const a = document.querySelector('#origin');
  const b = document.querySelector('#destination');
  [a.value, b.value] = [b.value, a.value];
  for (const id of ['origin', 'destination']) {
    document.querySelector(`.${id} .results`).replaceChildren();
    document.querySelector(`#${id}-status`).textContent = selected[id] ? `선택됨 · ${selected[id].address}` : '';
  }
  resetResult();
});

calculate.addEventListener('click', () => {
  if (!selected.origin || !selected.destination) return;
  const km = distanceKm(selected.origin, selected.destination);
  const meters = km < 1;
  document.querySelector('#distance').textContent = (meters ? Math.round(km * 1000) : km).toLocaleString('ko-KR', { maximumFractionDigits: meters ? 0 : 2 });
  document.querySelector('#unit').textContent = meters ? 'm' : 'km';
  document.querySelector('#map-link').href = mapUrl(selected.origin, selected.destination);
  result.hidden = false;
  hint.textContent = `${selected.origin.name} → ${selected.destination.name}`;
});
