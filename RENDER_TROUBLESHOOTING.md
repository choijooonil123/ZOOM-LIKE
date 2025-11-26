# Render 저장소 연결 문제 해결

## 문제: 저장소를 찾을 수 없음

### 해결 방법 1: GitHub 계정 재연결

1. **"Credentials (1)" 버튼 클릭**
   - 검색창 오른쪽에 있는 버튼
   
2. **GitHub 계정 확인/재연결**
   - GitHub 아이콘 클릭
   - "Connect GitHub" 또는 "Reconnect" 선택
   - GitHub 인증 진행
   - 저장소 접근 권한 허용

3. **저장소 목록 새로고침**
   - 페이지 새로고침 (F5)
   - 다시 검색 시도

---

### 해결 방법 2: 저장소 이름으로 검색

"choijooonil123" 대신 저장소 이름으로 검색:

- **"ZOOM-LIKE"** 입력
- 또는 **"ZOOM"** 입력

---

### 해결 방법 3: Public Git Repository 사용

저장소가 여전히 보이지 않으면:

1. **"Public Git Repository" 탭 클릭**
2. 저장소 URL 입력:
   ```
   https://github.com/choijooonil123/ZOOM-LIKE.git
   ```
3. "Continue" 클릭

---

### 해결 방법 4: GitHub 저장소 확인

저장소가 실제로 존재하는지 확인:

1. 브라우저에서 직접 접속:
   ```
   https://github.com/choijooonil123/ZOOM-LIKE
   ```
2. 저장소가 private인지 public인지 확인
3. 저장소 이름이 정확한지 확인

---

## 체크리스트

- [ ] GitHub 계정이 Render에 연결되어 있음
- [ ] 저장소 접근 권한이 허용됨
- [ ] 저장소가 존재함 (GitHub에서 확인)
- [ ] 저장소 이름이 정확함 (`ZOOM-LIKE`)

---

## 다음 단계

저장소를 찾은 후:
1. 저장소 선택
2. Render가 `render.yaml` 자동 인식
3. "Create Web Service" 클릭
4. 배포 시작!





