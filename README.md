# 사이 · 거리 측정

한국어 반응형 웹앱입니다. Nominatim에서 출발지와 도착지를 검색해 실제 검색 결과를 선택하면, Haversine 공식으로 지구의 곡률을 반영한 두 지점 사이의 **직선거리**를 계산합니다. 도로 주행거리 계산은 포함하지 않습니다. 결과 아래 **지도에서 보기**는 두 좌표가 입력된 OpenStreetMap 길찾기를 새 탭으로 엽니다. 그 지도에서 표시하는 도로 거리는 앱의 직선거리와 다를 수 있습니다.

## Vercel 배포

1. 이 폴더의 파일들을 GitHub 저장소에 올립니다.
2. Vercel에서 Add New → Project → 해당 GitHub 저장소를 Import 합니다.
3. Root Directory는 이 프로젝트 폴더, Framework Preset은 **Other**로 둡니다. `vercel.json`이 Output Directory를 `public`으로 설정합니다. Build Command와 Install Command는 비워 둡니다(필요하면 Override를 켜고 빈 값으로 설정).
4. 환경변수 입력 없이 Deploy 합니다.

Redis, 데이터베이스, API 키, 서버 함수, npm 패키지 설치 및 빌드가 필요하지 않습니다. Google Fonts가 차단되면 시스템 글꼴을 사용합니다.

## 로컬 실행

Node.js 20 이상에서 `npm run dev`를 실행하고 http://localhost:3000 으로 접속합니다. `npm test`로 거리와 지도 URL 검증을 실행합니다. HTML 파일을 더블클릭하는 대신 HTTP 서버를 사용하세요.

## 검색 서비스와 운영 범위

- 검색 버튼 또는 Enter를 눌렀을 때만 조회합니다. 자동완성은 구현하지 않습니다.
- `public/app.js`의 `SEARCH_ENDPOINT`에서 검색 제공자를 교체할 수 있습니다.
- 같은 페이지의 요청 사이에 최소 1.1초 간격을 두고, 결과를 메모리와 브라우저 localStorage에 24시간 캐시합니다. 저장소가 차단되어도 검색은 동작합니다.
- 브라우저가 배포 사이트의 Referer를 보내 앱을 식별합니다. 검색어는 Nominatim으로 전달되므로 개인정보나 비밀을 입력하지 마세요.
- 공개 Nominatim은 소규모 사용을 위한 서비스이며 최대 초당 1회 요청 제한이 있습니다. 이 앱의 제한은 페이지 단위입니다. 서로 다른 방문자나 여러 탭을 아우르는 서비스 전체 제한을 보장하지는 않습니다. 방문자가 늘면 제공자를 바꾸거나 별도의 전역 요청 제어를 도입해야 합니다. Redis 없는 정적 배포만으로 공개 API의 대규모 사용을 보장할 수는 없습니다.
- 검색 결과는 OpenStreetMap 등록 데이터에 따라 달라집니다. 검색되지 않는 장소는 지역명 또는 주소로 다시 검색해 주세요. 공개 API 장애 및 제한 시 오류 메시지를 표시합니다.
- 출처: [Nominatim 이용 정책](https://operations.osmfoundation.org/policies/nominatim/), [검색 API](https://nominatim.org/release-docs/latest/api/Search/), [OpenStreetMap 저작권](https://www.openstreetmap.org/copyright), [Vercel 설정](https://vercel.com/docs/project-configuration/vercel-json).

## 파일

- `public/index.html`, `public/style.css`: 화면과 반응형 스타일
- `public/app.js`: 명시적 장소 검색, 결과 선택, 캐시, 오류 처리
- `public/distance.js`: 거리 계산과 지도 링크
- `vercel.json`: 정적 배포 설정
- `scripts/serve.js`: 의존성 없는 로컬 개발 서버
