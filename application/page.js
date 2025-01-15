"use client";

import React, { useRef, useEffect, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import styles from "../../styles/Dashboard.module.scss";
import { AiOutlineSearch } from "react-icons/ai";
import ParkingDetails from "../../components/ParkingDetails";
import { HiLocationMarker } from "react-icons/hi";
import Image from "next/image";
import parkingData from "../../components/ParkingData.js"; // 주차장 데이터 가져오기

const Dashboard = () => {
  const mapRef = useRef(null);
  const currentMarkerRef = useRef(null);
  const searchMarkersRef = useRef([]);
  const [searchText, setSearchText] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedParking, setSelectedParking] = useState(null);
  const [dragStartY, setDragStartY] = useState(null);
  const [bottomSheetHeight, setBottomSheetHeight] = useState(250);
  const [searchDestinationName, setSearchDestinationName] = useState("");

  useEffect(() => {
    const customIcon = L.icon({
      iconUrl: "/Destination.png",
      iconSize: [42, 42],
      iconAnchor: [15, 42],
    });

    if (!mapRef.current) {
      const initialLat = 37.5704;
      const initialLon = 126.9823;

      mapRef.current = L.map("map", {
        zoomControl: false,
      }).setView([initialLat, initialLon], 18);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "© OpenStreetMap contributors",
      }).addTo(mapRef.current);

      currentMarkerRef.current = L.marker([initialLat, initialLon], {
        icon: customIcon,
      })
        .addTo(mapRef.current)
        .bindTooltip("현재 위치", {
          permanent: true,
          direction: "top",
          offset: [0, -40],
        });
    }
  }, []);

  const handleSearch = async () => {
    if (!searchText.trim()) return;

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          searchText
        )}&format=json`
      );
      const data = await response.json();

      if (data && data.length > 0) {
        const { lat, lon, display_name } = data[0];

        const simplifiedName = display_name.split(",")[0];
        const offsetLat = parseFloat(lat) - 0.005;
        mapRef.current.setView([offsetLat, parseFloat(lon)], 15);

        const destinationIcon = L.icon({
          iconUrl: "/Destination.png",
          iconSize: [42, 42],
          iconAnchor: [15, 42],
        });

        const destinationMarker = L.marker([parseFloat(lat), parseFloat(lon)], {
          icon: destinationIcon,
        })
          .addTo(mapRef.current)
          .bindTooltip("도착지", {
            permanent: true,
            direction: "top",
            offset: [0, -40],
          });

        searchMarkersRef.current.push(destinationMarker);
        setHasSearched(true);
        setIsExpanded(false);
        setSearchDestinationName(simplifiedName);

        parkingData.forEach((parking) => {
          let pinIconUrl = "/GreenPin.png";
          if (parseInt(parking.percent) < 60) {
            pinIconUrl = "/RedPin.png";
          } else if (parseInt(parking.percent) < 80) {
            pinIconUrl = "/YellowPin.png";
          }

          const parkingIcon = L.icon({
            iconUrl: pinIconUrl,
            iconSize: [28, 42],
            iconAnchor: [15, 42],
          });

          const marker = L.marker([parking.latitude, parking.longitude], {
            icon: parkingIcon,
          })
            .addTo(mapRef.current)
            .bindTooltip(
              `<div style="text-align:center;">
                 <b>${parking.percent}</b>
               </div>`,
              {
                permanent: true,
                direction: "top",
                offset: [0, -40],
              }
            );

          searchMarkersRef.current.push(marker);
        });
      } else {
        alert("검색 결과를 찾을 수 없습니다.");
      }
    } catch (error) {
      console.error("검색 중 오류 발생:", error);
      alert("검색 중 오류가 발생했습니다.");
    }
  };

  const handleParkingClick = (parking) => {
    setSelectedParking(parking);
    setIsExpanded(false);
  };

  const handleDragStart = (e) => {
    setDragStartY(e.touches[0].clientY);
  };

  const handleDragMove = (e) => {
    const dragDistance = dragStartY - e.touches[0].clientY;

    if (dragDistance > 0) {
      setBottomSheetHeight(250 + dragDistance);
    } else {
      setBottomSheetHeight(250 + dragDistance > 250 ? 250 + dragDistance : 250);
    }
  };

  const handleDragEnd = () => {
    if (bottomSheetHeight > 400) {
      setIsExpanded(true);
      setBottomSheetHeight(500);
    } else {
      setIsExpanded(false);
      setBottomSheetHeight(250);
    }
  };

  const handleCloseDetails = () => {
    setSelectedParking(null);
    setIsExpanded(false);
  };

  return (
    <div className={styles.Container}>
      <div className={styles.Header}>
        <div className={styles.LeftHeader}>
          <Image
            src="/time.png"
            alt="시간 아이콘"
            width={56}
            height={20}
            className={styles.TimeIcon}
          />
        </div>
        <div className={styles.RightHeader}>
          <Image
            src="/battery.png"
            alt="배터리 아이콘"
            width={72}
            height={15}
            className={styles.BatteryIcon}
          />
        </div>
      </div>

      <div className={styles.SearchContainer}>
        <AiOutlineSearch className={styles.SearchIcon} onClick={handleSearch} />
        <input
          type="text"
          placeholder="장소, 주소 검색"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className={styles.SearchInput}
        />
      </div>

      <div id="map" className={styles.Map}></div>

      {hasSearched && (
        <div
          className={`${styles.BottomSheet} ${
            isExpanded ? styles.Expanded : ""
          }`}
          style={{ height: `${bottomSheetHeight}px` }}
        >
          <div
            className={styles.Handle}
            onTouchStart={handleDragStart}
            onTouchMove={handleDragMove}
            onTouchEnd={handleDragEnd}
          >
            <div className={styles.HandleBar}></div>
          </div>

          {selectedParking ? (
            <ParkingDetails
              name={selectedParking.name}
              details1={selectedParking.details1}
              details2={selectedParking.details2}
              phone={selectedParking.phone}
              address={selectedParking.address}
              percent={selectedParking.percent}
              fees={selectedParking.fees}
              operatingHours={selectedParking.operatingHours}
              graphData={selectedParking.graphData}
              onClose={handleCloseDetails}
            />
          ) : (
            <div className={styles.Content}>
              <div className={styles.ContentTitle}>
                <div className={styles.TitleFont}>
                  {searchDestinationName || "검색한 장소 이름이 여기에 표시됩니다."}
                </div>
              </div>
              <div className={styles.ContentTitle2}>
                <div className={styles.TitleFont2}>소요시간 47분</div>
              </div>
              {[...parkingData]
                .sort((a, b) => parseInt(b.percent) - parseInt(a.percent))
                .map((parking) => (
                  <div
                    key={parking.id}
                    className={styles.ContentBody}
                    onClick={() => handleParkingClick(parking)}
                  >
                    <div className={styles.ContentIcon}>
                      <HiLocationMarker
                        style={{
                          width: "30px",
                          height: "30px",
                          color:
                            parseInt(parking.percent) >= 80
                              ? "#529F33"
                              : parseInt(parking.percent) >= 60
                              ? "#F9E33C"
                              : "#C91C1C",
                        }}
                      />
                    </div>
                    <div className={styles.ContentTitle}>{parking.name}</div>
                    <div className={styles.ContentPercents}>
                      {parking.details1}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
