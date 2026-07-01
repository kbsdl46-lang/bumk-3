# 공공직군 행정업무 슈퍼앱 Operation

## 1. 로컬 개발 환경

### 필수 도구

| 도구 | 용도 | 현재 확인 상태 |
| --- | --- | --- |
| Node.js | FE 실행 | 설치됨 |
| npm | FE 패키지 관리 | `npm.cmd` 사용 권장 |
| uv | Python venv 및 패키지 관리 | 설치됨 |
| Python | BE 실행 | uv 관리 Python 사용 |
| SQLite | DB | Python 내장 sqlite3 사용 가능 |

## 2. Frontend 실행 준비

현재 FE 모듈은 `frontend` 폴더에 설치되어 있다.

설치된 주요 모듈:

```text
react
react-dom
vite
typescript
@vitejs/plugin-react
```

PowerShell 실행 정책 때문에 `npm` 직접 실행이 막힐 수 있으므로 Windows에서는 `npm.cmd`를 사용한다.

```powershell
cd frontend
npm.cmd install
```

현재 Vite 프로젝트 파일과 실행 스크립트가 추가되어 있으므로 다음 명령으로 실행한다.

```powershell
cd frontend
npm.cmd run dev
```

빌드 명령은 다음과 같다.

```powershell
cd frontend
npm.cmd run build
```

## 3. Backend 실행 준비

Backend는 반드시 `uv`를 사용한다.

현재 `backend/.venv`가 준비되어 있고 FastAPI가 설치되어 있다.

Windows 환경에서 uv 기본 캐시 경로 접근 오류가 발생할 수 있으므로 프로젝트 로컬 캐시를 지정한다.

```powershell
cd backend
$env:UV_CACHE_DIR="..\.uv-cache"
uv venv .venv --allow-existing
uv pip install fastapi --python .venv\Scripts\python.exe
```

설치 확인:

```powershell
cd backend
.venv\Scripts\python.exe -c "import fastapi; print(fastapi.__version__)"
```

현재 FastAPI 앱 파일이 추가되어 있으므로 다음 명령으로 실행한다.

```powershell
cd backend
$env:UV_CACHE_DIR="..\.uv-cache"
uv run --no-sync uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

`uvicorn` 의존성은 현재 설치되어 있다. 다시 설치해야 하는 경우 다음 명령을 사용한다.

```powershell
cd backend
$env:UV_CACHE_DIR="..\.uv-cache"
uv pip install uvicorn --python .venv\Scripts\python.exe
```

## 4. DB 운영

초기 DB는 SQLite 파일 기반으로 운영한다.

권장 위치:

```text
backend/data/app.db
```

권장 원칙:

- 개발 환경에서는 SQLite 파일을 로컬에 둔다.
- 운영 전환 시 DB 파일 백업 경로를 별도로 지정한다.
- 마이그레이션 도구 도입 전까지는 초기화 SQL 또는 Python 초기화 스크립트를 관리한다.
- 민원, 엑셀 업로드 파일과 DB 백업 파일은 저장 기간을 분리한다.

## 5. 파일 저장 정책

권장 폴더:

```text
backend/uploads/
backend/outputs/
```

운영 원칙:

- 업로드 파일은 원본 파일명을 그대로 저장하지 않는다.
- 서버 저장 파일명은 UUID 또는 해시 기반으로 생성한다.
- 엑셀 처리 결과는 다운로드 완료 후 일정 기간 뒤 삭제한다.
- 민원 매뉴얼은 운영자가 명시적으로 삭제하기 전까지 보관할 수 있다.
- 민원 내용 원문은 기본 로그에 남기지 않는다.

## 6. 뉴스 수집 운영

MVP에서는 수동 실행 API를 먼저 제공한다.

향후 자동 실행 방식:

- Windows: 작업 스케줄러
- Linux: Cron
- 서버 앱 내부: APScheduler

권장 수집 시간:

```text
매일 07:00 - 08:00
```

운영 유의사항:

- 같은 URL은 중복 저장하지 않는다.
- 기사 제목과 URL을 함께 기준으로 중복 여부를 판단한다.
- 수집 실패 시 전체 작업을 중단하지 않고 키워드별 오류를 기록한다.
- 대상 사이트의 이용 조건과 robots 정책을 확인한다.

## 7. 자주 발생하는 에러

### 7.1 PowerShell에서 npm 실행 오류

증상:

```text
이 시스템에서 스크립트를 실행할 수 없으므로 npm.ps1 파일을 로드할 수 없습니다.
```

원인:

PowerShell 실행 정책 때문에 `npm.ps1` 실행이 차단된다.

대응:

```powershell
npm.cmd install
npm.cmd run dev
```

### 7.2 uv 캐시 접근 권한 오류

증상:

```text
Failed to initialize cache at C:\Users\admin\AppData\Local\uv\cache
```

원인:

uv 기본 캐시 경로 접근 권한 문제.

대응:

```powershell
$env:UV_CACHE_DIR="..\.uv-cache"
uv venv .venv --allow-existing
```

프로젝트 루트에서 실행할 때는 다음처럼 지정한다.

```powershell
$env:UV_CACHE_DIR=".uv-cache"
uv run python --version
```

### 7.3 sqlite3 명령어 없음

증상:

```text
sqlite3 : 용어가 cmdlet, 함수, 스크립트 파일 또는 실행할 수 있는 프로그램 이름으로 인식되지 않습니다.
```

원인:

SQLite CLI가 설치되어 있지 않다.

대응:

Python 내장 sqlite3 모듈을 사용한다.

```powershell
python -c "import sqlite3; print(sqlite3.sqlite_version)"
```

현재 환경에서는 일반 `python` 실행에 문제가 있을 수 있으므로 uv 또는 venv Python을 우선 사용한다.

```powershell
cd backend
.venv\Scripts\python.exe -c "import sqlite3; print(sqlite3.sqlite_version)"
```

### 7.4 FastAPI는 설치됐지만 서버 실행이 안 됨

가능 원인:

- `uvicorn` 미설치
- `app/main.py` 미작성
- 실행 위치 오류

대응:

```powershell
cd backend
$env:UV_CACHE_DIR="..\.uv-cache"
uv pip install uvicorn --python .venv\Scripts\python.exe
```

서버 실행은 다음 명령을 사용한다.

```powershell
uv run --no-sync uvicorn app.main:app --reload
```

## 8. 사용 시나리오

### 8.1 일정 등록

1. 일정 관리 화면으로 이동한다.
2. 날짜를 선택한다.
3. 제목, 팀원, 유형, 시작일시, 종료일시를 입력한다.
4. 저장한다.
5. 캘린더에서 등록된 일정을 확인한다.

### 8.2 엑셀 분리

1. 엑셀 자동화 화면으로 이동한다.
2. 엑셀 파일을 업로드한다.
3. 시스템이 컬럼 목록을 표시한다.
4. 분리 기준 컬럼을 선택한다.
5. 분리 실행 버튼을 누른다.
6. 결과 파일을 다운로드한다.

### 8.3 엑셀 병합

1. 엑셀 자동화 화면으로 이동한다.
2. 여러 엑셀 파일을 업로드한다.
3. 병합 방식을 선택한다.
4. 병합 실행 버튼을 누른다.
5. 결과 파일을 다운로드한다.

### 8.4 민원 대응 스크립트 작성

1. 민원 챗봇 화면으로 이동한다.
2. 운영자가 민원 매뉴얼을 업로드한다.
3. 사용자가 민원 내용을 입력한다.
4. 시스템이 관련 근거와 응대 초안을 생성한다.
5. 담당자가 내용을 검토한 뒤 최종 응대에 활용한다.

### 8.5 뉴스 확인

1. 뉴스 화면으로 이동한다.
2. 최신 수집 기사 목록을 확인한다.
3. 키워드로 필터링한다.
4. 필요한 기사의 원문 링크를 연다.

## 9. 운영 체크리스트

- FE 의존성 설치 여부 확인
- BE `.venv` 생성 여부 확인
- FastAPI 설치 여부 확인
- uv 캐시 경로 설정 확인
- SQLite DB 파일 백업 확인
- 업로드 파일 저장소 용량 확인
- 뉴스 수집 실패 로그 확인
- 민원 매뉴얼 최신본 반영 여부 확인
