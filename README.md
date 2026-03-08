# KML Kakao Map

최소 기능:

- 여러 KML 파일 드래그 업로드
- `Placemark > Point > coordinates` 좌표 추출
- 카카오맵에 마커 표시
- 파일 수 / 점 수 표시

실행:

1. `config.js`의 `appKey`에 카카오 JavaScript 키 입력
2. 카카오 디벨로퍼스에서 테스트 도메인 등록
   - 예: `http://localhost:8080`
3. 정적 서버로 실행
   - 예: `python -m http.server 8080`

주의:

- 이 버전은 `Point`만 읽습니다.
- 도로 경로 계산, 순회 최적화는 아직 없습니다.
