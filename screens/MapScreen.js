import { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Platform } from "react-native";
import MapView, { Marker } from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";
import * as Location from "expo-location";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { useTheme } from "../theme/ThemeContext";

const GOOGLE_MAPS_API_KEY = "AIzaSyAEJuE9-rxXkYqIuCVGJ28yBOeBtrbMiy4"; // ✅ встав сюди

export async function fetchPlaces() {
  const q = query(collection(db, "places"), where("status", "==", "approved"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export default function MapScreen({ navigation, places = [], routeToPlaceId, routeMode }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const styles = useMemo(() => makeStyles(c), [c]);

  const mapRef = useRef(null);

  const [hasLocationPermission, setHasLocationPermission] = useState(null);
  const [myLocation, setMyLocation] = useState(null);

  const initialRegion = useMemo(
    () => ({
      latitude: 50.6199,
      longitude: 26.2516,
      latitudeDelta: 0.08,
      longitudeDelta: 0.08,
    }),
    []
  );

  // ✅ рухома “моя точка”
  useEffect(() => {
    let sub = null;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        const granted = status === "granted";
        setHasLocationPermission(granted);
        if (!granted) return;

        const cur = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setMyLocation({ latitude: cur.coords.latitude, longitude: cur.coords.longitude });

        sub = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.Balanced, timeInterval: 1500, distanceInterval: 2 },
          (pos) => setMyLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude })
        );
      } catch (e) {
        console.log("Location error:", e);
        setHasLocationPermission(false);
      }
    })();

    return () => sub?.remove?.();
  }, []);

  const goToMyLocation = () => {
    if (!myLocation || !mapRef.current) return;
    mapRef.current.animateToRegion(
      { ...myLocation, latitudeDelta: 0.02, longitudeDelta: 0.02 },
      350
    );
  };

  // ✅ Куди будуємо маршрут
  const destinationPlace = useMemo(() => {
    if (!routeToPlaceId) return null;
    return (places || []).find((p) => p.id === routeToPlaceId) || null;
  }, [places, routeToPlaceId]);

  const destination = useMemo(() => {
    if (!destinationPlace) return null;
    const latitude = Number(destinationPlace.latitude);
    const longitude = Number(destinationPlace.longitude);
    if (Number.isNaN(latitude) || Number.isNaN(longitude)) return null;
    return { latitude, longitude };
  }, [destinationPlace]);

  return (
    <View style={{ flex: 1 }}>
      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        initialRegion={initialRegion}
        showsUserLocation={false}
        showsMyLocationButton={false}
      >
        {/* ✅ Моя точка */}
        {myLocation ? (
          <Marker
            coordinate={myLocation}
            title="Моє місце"
            pinColor={Platform.OS === "ios" ? undefined : "dodgerblue"}
          />
        ) : null}

        {/* ✅ Маршрут в додатку */}
        {myLocation && destination && GOOGLE_MAPS_API_KEY ? (
          <MapViewDirections
            origin={myLocation}
            destination={destination}
            apikey={GOOGLE_MAPS_API_KEY}
            mode={routeMode === "DRIVING" ? "DRIVING" : "WALKING"}
            strokeWidth={5}
            strokeColor={c.primary}
            onReady={(res) => {
              // ✅ щоб одразу було видно весь маршрут
              mapRef.current?.fitToCoordinates(res.coordinates, {
                edgePadding: { top: 90, right: 40, bottom: 220, left: 40 },
                animated: true,
              });
            }}
            onError={(err) => {
              console.log("Directions error:", err);
            }}
          />
        ) : null}

        {/* ✅ Точки компаній */}
        {(places || []).map((p) => {
          const latitude = Number(p.latitude);
          const longitude = Number(p.longitude);
          if (Number.isNaN(latitude) || Number.isNaN(longitude)) return null;

          return (
            <Marker
              key={p.id}
              coordinate={{ latitude, longitude }}
              title={p.title || "Місце"}
              pinColor="green"
              onPress={() => navigation?.navigate?.("PlaceDetails", { placeId: p.id })}
            />
          );
        })}
      </MapView>

      <View style={styles.myBtnWrap}>
        <TouchableOpacity style={styles.myBtn} onPress={goToMyLocation} activeOpacity={0.9}>
          <Text style={styles.myBtnText}>📍 Моє місце</Text>
        </TouchableOpacity>

        {hasLocationPermission === false ? (
          <Text style={styles.locHint}>Нема доступу до геолокації. Дозволь у налаштуваннях телефону.</Text>
        ) : null}
      </View>
    </View>
  );
}

function makeStyles(c) {
  return StyleSheet.create({
    myBtnWrap: { position: "absolute", right: 14, bottom: 18, alignItems: "flex-end", gap: 8 },
    myBtn: {
      backgroundColor: c.primary,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 16,
      shadowColor: "#000",
      shadowOpacity: 0.15,
      shadowRadius: 10,
      elevation: 4,
    },
    myBtnText: { color: "#fff", fontWeight: "900" },
    locHint: {
      maxWidth: 240,
      color: c.muted,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      padding: 10,
      borderRadius: 14,
      textAlign: "right",
      fontWeight: "700",
    },
  });
}
