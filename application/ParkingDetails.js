import styles from "../styles/ParkingDetails.module.scss";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import annotationPlugin from "chartjs-plugin-annotation";
import { Bar } from "react-chartjs-2";

// Chart.js registration
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  annotationPlugin
);

const ParkingDetails = ({
  name,
  details1,
  details2,
  phone,
  address,
  operatingHours,
  fees,
  graphData,
  onClose,
}) => {
  const data = {
    labels: [
      "AM 6시",
      "AM 7시",
      "AM 8시",
      "AM 9시",
      "AM 10시",
      "AM 11시",
      "PM 12시",
      "PM 1시",
      "PM 2시",
      "PM 3시",
      "PM 4시",
      "PM 5시",
      "PM 6시",
      "PM 7시",
      "PM 8시",
      "PM 9시",
      "PM 10시",
    ],
    datasets: [
      {
        label: "빈자리 수",
        data: graphData || [],
        backgroundColor: (context) => {
          const index = context.dataIndex;
          if (index === 8) return "rgba(255, 223, 0, 0.8)"; // PM 2시 노란색
          if (index === 9) return "rgba(255, 69, 58, 0.8)"; // PM 3시 빨간색
          return "rgba(54, 162, 235, 0.6)"; // 기본 파란색
        },
        borderColor: (context) => {
          const index = context.dataIndex;
          if (index === 8) return "rgba(255, 223, 0, 1)"; // PM 2시 노란색 테두리
          if (index === 9) return "rgba(255, 69, 58, 1)"; // PM 3시 빨간색 테두리
          return "rgba(54, 162, 235, 1)"; // 기본 파란색 테두리
        },
        borderWidth: 1,
        barThickness: 12,
        borderRadius: 5,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: true,
      },
      annotation: {
        annotations: {
          currentTime: {
            type: "label",
            xValue: 8, // PM 2시
            yValue: graphData ? graphData[8] : 0,
            backgroundColor: "rgba(255, 255, 255, 0.8)",
            borderColor: "black",
            borderWidth: 1,
            color: "black",
            font: {
              size: 12,
              weight: "bold",
            },
          },
          arrivalTime: {
            type: "label",
            xValue: 9, // PM 3시
            yValue: graphData ? graphData[9] : 0,
            backgroundColor: "rgba(255, 255, 255, 0.8)",
            borderColor: "black",
            borderWidth: 1,
            color: "black",
            font: {
              size: 12,
              weight: "bold",
            },
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          drawOnChartArea: false,
          drawBorder: false,
        },
        ticks: {
          callback: function (value, index) {
            return index % 3 === 0 ? this.getLabelForValue(value) : "";
          },
          autoSkip: false,
        },
      },
      y: {
        display: false,
      },
    },
  };

  return (
    <div className={styles.Container}>
      <button onClick={onClose}>이전</button>
      <div className={styles.Content}>
        <div className={styles.Title}>
          <h2>{name}</h2>
        </div>
        <div className={styles.info}>
          <div className={styles.infobody}>{details2}</div>
        </div>
        <div className={styles.Line}></div>
        <div className={styles.ChartContainer}>
  <Bar data={data} options={options} />
  {/* 범례 추가 */}
  <div className={styles.Legend}>
    <div className={styles.LegendItem}>
      <div className={styles.YellowBox}></div>
      <span>현재 시간</span>
    </div>
    <div className={styles.LegendItem}>
      <div className={styles.RedBox}></div>
      <span>도착 시간</span>
    </div>
  </div>
</div>

        <div className={styles.Info}>
          <p>
            <b>전화번호:</b> {phone || "정보 없음"}
          </p>
          <p>
            <b>주소:</b> {address || "정보 없음"}
          </p>
          <p>
            <b>운영 시간:</b>
            <br />
            <b>평일:</b> {operatingHours?.weekdays || "정보 없음"}
            <br />
            <b>토요일:</b> {operatingHours?.saturday || "정보 없음"}
            <br />
            <b>일요일:</b> {operatingHours?.sunday || "정보 없음"}
          </p>
          <p>
            <b>요금:</b>
            <br />
            <b>기본 요금:</b> {fees?.basic || "정보 없음"}
            <br />
            <b>추가 요금:</b> {fees?.additional || "정보 없음"}
            <br />
            <b>일일 요금:</b> {fees?.daily || "정보 없음"}
            <br />
            <b>월정기 요금:</b> {fees?.monthly || "정보 없음"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ParkingDetails;
