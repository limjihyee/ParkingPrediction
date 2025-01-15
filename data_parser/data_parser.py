import requests
import xml.etree.ElementTree as ET
from urllib.parse import quote
import threading
import time
import csv

stop_flag = False  # Enter 입력 시 True로 바뀌어 루프 중단
parking_records = []  # 수집된 데이터를 계속 저장 (메모리에 유지)

def wait_for_keypress():
    """
    사용자 Enter 입력을 대기 -> stop_flag = True로 바꿔서 종료 신호
    """
    global stop_flag
    print("=== 실시간 수집을 시작합니다. 종료 후 CSV로 저장하려면 Enter 키를 누르세요. ===")
    input()  # 여기서 Enter 입력 대기
    stop_flag = True
    print("=== 종료 신호를 받았습니다. CSV로 내보내는 중... ===")

def fetch_parking_data(service_key, area_name):
    """
    주어진 지역(area_name)에 대해 API 요청 → XML 파싱 → 
    PRK_STTS 목록을 list(dict) 형태로 반환.
    """
    area_encoded = quote(area_name.encode('utf8'))
    url = f"http://openapi.seoul.go.kr:8088/{service_key}/xml/citydata/1/5/{area_encoded}"

    try:
        response = requests.get(url)
        if response.status_code != 200:
            print(f"[오류] HTTP {response.status_code} 응답.")
            return []

        root = ET.fromstring(response.content)  # <SeoulRtd.citydata> 루트
        citydata_tag = root.find("CITYDATA")
        if citydata_tag is None:
            print("[오류] CITYDATA 태그가 존재하지 않습니다.")
            return []

        prk_stts_tag = citydata_tag.find("PRK_STTS")
        if prk_stts_tag is None:
            print("[오류] PRK_STTS 태그가 없습니다.")
            return []

        prk_list = prk_stts_tag.findall("PRK_STTS")
        # 파싱 결과(한 번의 호출)에서 얻은 항목들을 list(dict)로 담기
        records = []
        now_str = time.strftime("%Y-%m-%d %H:%M:%S")  # 현재 시각 문자열

        for prk_item in prk_list:
            prk_nm_tag = prk_item.find("PRK_NM")
            cpcty_tag = prk_item.find("CPCTY")
            cur_cnt_tag = prk_item.find("CUR_PRK_CNT")

            prk_nm = prk_nm_tag.text if prk_nm_tag is not None else None
            cpcty = cpcty_tag.text if cpcty_tag is not None else None
            cur_cnt = cur_cnt_tag.text if cur_cnt_tag is not None else None

            row = {
                "timestamp": now_str,      # 수집 시각
                "PRK_NM": prk_nm,         # 주차장 이름
                "CPCTY": cpcty,           # 총 주차면 수
                "CUR_PRK_CNT": cur_cnt,   # 현재 주차중인 수
            }
            records.append(row)

        return records

    except Exception as e:
        print("[예외 발생]", e)
        return []

def main():
    service_key = "5479636a79776f6f36344d59774447"  # 실제 인증키
    area_name = "여의도"         # 원하는 지역
    csv_filename = "parking_data.csv"   # 최종 저장할 CSV 파일명

    # 별도 스레드에서 Enter 입력을 감지
    t = threading.Thread(target=wait_for_keypress, daemon=True)
    t.start()

    # 주기적으로(1분) 데이터 수집
    global stop_flag, parking_records

    while not stop_flag:
        # 1) 주차장 정보 한 번 수집
        new_records = fetch_parking_data(service_key, area_name)
        # 2) 결과를 전역 리스트(parking_records)에 추가
        parking_records.extend(new_records)

        # 3) 1분 대기 (stop_flag 체크)
        for _ in range(60):
            if stop_flag:
                break
            time.sleep(1)

    # 여기까지 오면 stop_flag = True → CSV 저장
    if parking_records:
        # CSV 저장 (DictWriter)
        columns = ["timestamp", "PRK_NM", "CPCTY", "CUR_PRK_CNT"]
        with open(csv_filename, "w", newline="", encoding="utf-8-sig") as f:
            writer = csv.DictWriter(f, fieldnames=columns)
            writer.writeheader()
            writer.writerows(parking_records)

        print(f"[완료] CSV 파일로 저장했습니다 → {csv_filename}")
    else:
        print("[안내] 수집된 데이터가 없습니다.")

    print("프로그램을 종료합니다.")

if __name__ == "__main__":
    main()
