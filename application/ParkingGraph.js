import React from "react";
import { Bar } from "react-chartjs-2";

const ParkingGraph = ({ data }) => {
  const chartData = {
    labels: [
      "AM 6시", "AM 9시", "PM 12시", "PM 3시", "PM 6시", "PM 9시",
    ],
    datasets: [
      {
        label: "주차 차량 수",
        data: data,
        backgroundColor: (ctx) => {
          const chart = ctx.chart;
          const { dataIndex } = ctx;
          return dataIndex === data.length - 1 ? "red" : "rgba(54, 162, 235, 0.6)";
        },
        borderColor: (ctx) => {
          const chart = ctx.chart;
          const { dataIndex } = ctx;
          return dataIndex === data.length - 1 ? "darkred" : "rgba(54, 162, 235, 1)";
        },
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <div style={{ width: "100%", height: "300px" }}>
      <Bar data={chartData} options={chartOptions} />
      <p style={{ color: "red", marginTop: "10px" }}>● 실시간: 크게 붐비지 않음</p>
    </div>
  );
};

export default ParkingGraph;
