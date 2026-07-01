# 공공직군 행정업무 슈퍼앱 Architecture

## 1. 기술 스택

| 영역 | 기술 |
| --- | --- |
| Frontend | TypeScript, Vite, React |
| Backend | Python, FastAPI |
| Python 패키지 관리 | uv |
| Database | SQLite |
| 파일 처리 | Python 표준 라이브러리, openpyxl 또는 pandas |
| 배치 실행 | Windows 작업 스케줄러 또는 OS Cron |

## 2. 전체 구조

```text
day3_rpa/
  frontend/
    package.json
    package-lock.json
    node_modules/
    index.html
    src/
      main.tsx
      App.tsx
      pages/
      components/
      api/
      styles/
  backend/
    .venv/
    pyproject.toml
    uv.lock
    app/
      main.py
      core/
      db/
      models/
      schemas/
      routers/
      services/
      jobs/
      storage/
    data/
      app.db
    uploads/
    outputs/
  docs/
    PRD.md
    Architecture.md
    Operation.md
    index.html
```

현재 시점에서는 FE 모듈과 BE uv 가상환경만 준비되어 있으며, 위 구조는 구현 단계에서 맞춰갈 권장 구조다.

## 3. 시스템 구성

```text
사용자 브라우저
  |
  | HTTP
  v
React + Vite Frontend
  |
  | REST API
  v
FastAPI Backend
  |
  | SQL / File IO / Scheduled Job
  v
SQLite + 업로드 파일 + 결과 파일
```

## 4. Frontend 모듈 역할

| 모듈 | 역할 |
| --- | --- |
| `src/main.tsx` | React 앱 진입점 |
| `src/App.tsx` | 라우팅과 공통 레이아웃 |
| `src/pages/DashboardPage.tsx` | 일정, 뉴스, 업무 바로가기 요약 |
| `src/pages/SchedulePage.tsx` | 팀원 일정 캘린더 |
| `src/pages/ExcelAutomationPage.tsx` | 엑셀 업로드, 컬럼 선택, 처리 결과 |
| `src/pages/ComplaintChatbotPage.tsx` | 민원 입력, 매뉴얼 기반 답변 |
| `src/pages/NewsPage.tsx` | 뉴스 목록, 키워드 필터 |
| `src/components/` | 공통 UI 컴포넌트 |
| `src/api/` | FastAPI 호출 함수 |
| `src/styles/` | 전역 스타일 |

## 5. Backend 모듈 역할

| 모듈 | 역할 |
| --- | --- |
| `app/main.py` | FastAPI 앱 생성, 라우터 등록, CORS 설정 |
| `app/core/config.py` | 환경 설정, 경로, DB 파일 위치 |
| `app/db/session.py` | SQLite 연결 관리 |
| `app/models/` | DB 테이블 모델 |
| `app/schemas/` | API 요청/응답 스키마 |
| `app/routers/schedules.py` | 일정 관리 API |
| `app/routers/excel.py` | 엑셀 자동화 API |
| `app/routers/complaints.py` | 민원 챗봇 API |
| `app/routers/news.py` | 뉴스 수집 및 조회 API |
| `app/services/schedule_service.py` | 일정 비즈니스 로직 |
| `app/services/excel_service.py` | 엑셀 분리, 병합 처리 |
| `app/services/complaint_service.py` | 매뉴얼 검색, 답변 생성 |
| `app/services/news_service.py` | 뉴스 수집, 중복 제거 |
| `app/jobs/news_collector.py` | 아침 뉴스 수집 배치 |
| `app/storage/` | 업로드 및 결과 파일 관리 |

## 6. API 설계 초안

### 6.1 일정 API

| Method | Path | 설명 |
| --- | --- | --- |
| `GET` | `/api/schedules` | 일정 목록 조회 |
| `POST` | `/api/schedules` | 일정 등록 |
| `GET` | `/api/schedules/{id}` | 일정 상세 조회 |
| `PUT` | `/api/schedules/{id}` | 일정 수정 |
| `DELETE` | `/api/schedules/{id}` | 일정 삭제 |

### 6.2 엑셀 API

| Method | Path | 설명 |
| --- | --- | --- |
| `POST` | `/api/excel/preview` | 업로드 파일 컬럼 미리보기 |
| `POST` | `/api/excel/split` | 특정 컬럼 기준 파일 분리 |
| `POST` | `/api/excel/merge` | 여러 파일 병합 |
| `GET` | `/api/excel/jobs/{id}/download` | 결과 파일 다운로드 |

### 6.3 민원 챗봇 API

| Method | Path | 설명 |
| --- | --- | --- |
| `POST` | `/api/complaints/manuals` | 민원 매뉴얼 업로드 |
| `GET` | `/api/complaints/manuals` | 매뉴얼 목록 조회 |
| `POST` | `/api/complaints/chat` | 민원 대응 초안 생성 |

### 6.4 뉴스 API

| Method | Path | 설명 |
| --- | --- | --- |
| `GET` | `/api/news/articles` | 수집 기사 목록 조회 |
| `POST` | `/api/news/collect` | 뉴스 수집 수동 실행 |
| `GET` | `/api/news/keywords` | 키워드 목록 조회 |
| `POST` | `/api/news/keywords` | 키워드 등록 |
| `DELETE` | `/api/news/keywords/{id}` | 키워드 삭제 |

## 7. SQLite 테이블 초안

### team_members

| 컬럼 | 타입 | 설명 |
| --- | --- | --- |
| id | integer | PK |
| name | text | 이름 |
| role | text | 직무 |
| department | text | 부서 |
| is_active | integer | 사용 여부 |
| created_at | text | 생성일 |

### schedules

| 컬럼 | 타입 | 설명 |
| --- | --- | --- |
| id | integer | PK |
| member_id | integer | 팀원 ID |
| title | text | 일정명 |
| type | text | 휴가, 근무, 출장 등 |
| starts_at | text | 시작일시 |
| ends_at | text | 종료일시 |
| memo | text | 메모 |
| created_at | text | 생성일 |
| updated_at | text | 수정일 |

### excel_jobs

| 컬럼 | 타입 | 설명 |
| --- | --- | --- |
| id | integer | PK |
| job_type | text | split 또는 merge |
| status | text | pending, running, success, failed |
| source_file | text | 원본 파일 경로 |
| output_file | text | 결과 파일 경로 |
| summary_json | text | 처리 결과 요약 |
| error_message | text | 오류 메시지 |
| created_at | text | 생성일 |

### complaint_manuals

| 컬럼 | 타입 | 설명 |
| --- | --- | --- |
| id | integer | PK |
| filename | text | 원본 파일명 |
| stored_path | text | 저장 경로 |
| extracted_text | text | 추출 텍스트 |
| created_at | text | 생성일 |

### news_articles

| 컬럼 | 타입 | 설명 |
| --- | --- | --- |
| id | integer | PK |
| title | text | 기사 제목 |
| publisher | text | 언론사 |
| published_at | text | 발행일 |
| url | text | 기사 링크 |
| summary | text | 요약 |
| keyword | text | 수집 키워드 |
| created_at | text | 수집일 |

### news_keywords

| 컬럼 | 타입 | 설명 |
| --- | --- | --- |
| id | integer | PK |
| keyword | text | 수집 키워드 |
| is_active | integer | 사용 여부 |
| created_at | text | 생성일 |

## 8. 데이터 흐름

### 8.1 일정 등록

1. 사용자가 캘린더에서 일정을 입력한다.
2. FE가 `/api/schedules`로 요청한다.
3. BE가 입력값을 검증한다.
4. SQLite `schedules` 테이블에 저장한다.
5. FE가 캘린더를 갱신한다.

### 8.2 엑셀 분리

1. 사용자가 엑셀 파일을 업로드한다.
2. BE가 파일을 `uploads/`에 임시 저장한다.
3. 파일 헤더를 분석해 컬럼 목록을 반환한다.
4. 사용자가 기준 컬럼을 선택한다.
5. BE가 기준 컬럼 값별로 파일을 분리한다.
6. 결과 파일을 `outputs/`에 저장한다.
7. 사용자가 결과 파일을 다운로드한다.

### 8.3 민원 대응

1. 운영자가 민원 매뉴얼을 업로드한다.
2. BE가 텍스트를 추출해 저장한다.
3. 사용자가 민원 내용을 입력한다.
4. BE가 관련 매뉴얼 내용을 검색한다.
5. 대응 방향과 응대 스크립트 초안을 반환한다.

### 8.4 뉴스 수집

1. 배치 또는 사용자가 뉴스 수집을 실행한다.
2. BE가 활성 키워드를 조회한다.
3. 키워드별 기사를 수집한다.
4. URL 또는 제목 기준으로 중복을 제거한다.
5. SQLite에 저장한다.
6. FE가 최신 기사 목록을 표시한다.

## 9. 보안 및 개인정보 고려사항

- 민원 내용과 첨부 파일은 개인정보가 포함될 수 있으므로 로그에 원문을 남기지 않는다.
- 업로드 파일 저장 위치와 보관 기간을 운영 정책에 포함한다.
- 파일명은 서버 저장 시 난수 기반 이름으로 변경한다.
- 다운로드 API는 허용된 결과 파일만 접근 가능해야 한다.
- 외부 LLM을 사용할 경우 개인정보 비식별화 단계를 선행한다.
- 뉴스 수집은 대상 사이트의 이용 조건을 확인한다.

## 10. 초기 구현 우선순위

1. 프로젝트 기본 구조 생성
2. FastAPI 헬스체크 API
3. SQLite 초기화
4. 일정 CRUD
5. 엑셀 파일 업로드 및 컬럼 미리보기
6. 엑셀 분리 또는 병합
7. 뉴스 수집 수동 실행
8. 민원 매뉴얼 업로드 및 텍스트 검색

