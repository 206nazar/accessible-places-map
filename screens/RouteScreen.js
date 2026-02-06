import { useEffect, useMemo, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import * as Location from "expo-location";
import { useTheme } from "../theme/ThemeContext";

// ⚠️ НЕ тримай ключ прямо в коді надовго. Нижче я дам як винести в env.
// Тимчасово можеш вставити сюди:
const GOOGLE_MAPS_API_KEY = "AIzaSyAEJuE9-rxXkYqIuCVGJ28yBOeBtrbMiy4";

function decodePolyline(encoded) {
  // Google Encoded Polyline Algorithm Format
  let index = 0, lat = 0, lng = 0, coordinates = [];

  while (index < encoded.length) {
    let b, shift = 0, result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = (result & 1) ? ~(result >> 1) : (result >> 1);
    lat += dlat;

    shift = 0; result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = (result & 1) ? ~(result >> 1) : (result >> 1);
    lng += dlng;

    coordinates.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }
  return coordinates;
}

export default function RouteScreen({ route }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const styles = useMemo(() => makeStyles(c), [c]);

  const place = route?.params?.place; // { title, latitude, longitude, ... }

  const [mode, setMode] = useState("walking"); // walking | driving
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);

  const [poly, setPoly] = useState([]);
  const [meta, setMeta] = useState({ distanceText: "", durationText: "" });

  const ensureLocation = async () => {
    const perm = await Location.requestForegroundPermissionsAsync();
    if (!perm.granted) {
      setLoading(false);
      throw new Error("Нема доступу до геолокації. Дозволь у налаштуваннях телефону.");
    }

    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    setMe({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
  };

  const loadRoute = async (origin, destination, travelMode) => {
    const o = `${origin.latitude},${origin.longitude}`;
    const d = `${destination.latitude},${destination.longitude}`;

    const url =
      `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(o)}` +
      `&destination=${encodeURIComponent(d)}&mode=${encodeURIComponent(travelMode)}` +
      `&key=${encodeURIComponent(GOOGLE_MAPS_API_KEY)}`;

    const res = await fetch(url);
    const data = await res.json();

    if (data.status !== "OK") {
      const msg = data?.error_message || data?.status || "Directions API error";
      throw new Error(`Маршрут: ${msg}`);
    }

    const leg = data.routes?.[0]?.legs?.[0];
    const points = data.routes?.[0]?.overview_polyline?.points;

    setMeta({
      distanceText: leg?.distance?.text || "",
      durationText: leg?.duration?.text || "",
    });

    setPoly(points ? decodePolyline(points) : []);
  };

  const reloadAll = async (nextMode) => {
    setLoading(true);
    try {
      await ensureLocation();
      const origin = me; // може ще не встигнути оновитись
      const fresh = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const origin2 = { latitude: fresh.coords.latitude, longitude: fresh.coords.longitude };
      setMe(origin2);

      await loadRoute(
        origin2,
        { latitude: Number(place.latitude), longitude: Number(place.longitude) },
        nextMode
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!place) return;
    reloadAll(mode).catch((e) => {
      setLoading(false);
      alert(e.message);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placeIdSafe(place)]);

  // перезавантажувати маршрут при зміні mode
  useEffect(() => {
    if (!place) return;
    reloadAll(mode).catch((e) => alert(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  if (!place) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Помилка: не передано місце.</Text>
      </View>
    );
  }

  const dest = { latitude: Number(place.latitude), longitude: Number(place.longitude) };

  const region = me
    ? {
        latitude: (me.latitude + dest.latitude) / 2,
        longitude: (me.longitude + dest.longitude) / 2,
        latitudeDelta: Math.abs(me.latitude - dest.latitude) * 2 + 0.02,
        longitudeDelta: Math.abs(me.longitude - dest.longitude) * 2 + 0.02,
      }
    : {
        latitude: dest.latitude,
        longitude: dest.longitude,
        latitudeDelta: 0.04,
        longitudeDelta: 0.04,
      };

  return (
    <View style={styles.container}>
      <View style={styles.topCard}>
        <Text style={styles.title}>Маршрут</Text>
        <Text style={styles.sub} numberOfLines={1}>
          До: {place.title || "Місце"}
        </Text>

        <View style={styles.modeRow}>
          <TouchableOpacity
            style={[styles.modeBtn, mode === "walking" && styles.modeBtnActive]}
            onPress={() => setMode("walking")}
            activeOpacity={0.9}
          >
            <Text style={[styles.modeText, mode === "walking" && styles.modeTextActive]}>🚶 Пішки</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeBtn, mode === "driving" && styles.modeBtnActive]}
            onPress={() => setMode("driving")}
            activeOpacity={0.9}
          >
            <Text style={[styles.modeText, mode === "driving" && styles.modeTextActive]}>🚗 Машина</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.refreshBtn} onPress={() => reloadAll(mode)} activeOpacity={0.9}>
            <Text style={styles.refreshText}>⟳</Text>
          </TouchableOpacity>
        </View>

        {!!meta.distanceText || !!meta.durationText ? (
          <Text style={styles.meta}>
            {meta.distanceText} • {meta.durationText}
          </Text>
        ) : null}
      </View>

      <View style={{ flex: 1 }}>
        <MapView style={{ flex: 1 }} initialRegion={region} region={region}>
          <Marker coordinate={dest} title={place.title || "Місце"} />

          {me ? <Marker coordinate={me} title={"Ви тут"} pinColor={"blue"} /> : null}

          {poly.length > 0 ? <Polyline coordinates={poly} strokeWidth={5} /> : null}
        </MapView>

        {loading ? (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" />
            <Text style={styles.loadingText}>Будую маршрут…</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

function placeIdSafe(place) {
  // просто щоб useEffect реагував, якщо place міняється
  return `${place?.latitude || ""}_${place?.longitude || ""}_${place?.title || ""}`;
}

function makeStyles(c) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg },
    center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: c.bg },
    muted: { color: c.muted, fontWeight: "700" },

    topCard: {
      padding: 12,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
      backgroundColor: c.surface,
    },
    title: { color: c.text, fontWeight: "900", fontSize: 18 },
    sub: { color: c.muted, marginTop: 2, fontWeight: "700" },

    modeRow: { flexDirection: "row", gap: 10, marginTop: 10, alignItems: "center" },
    modeBtn: {
      flex: 1,
      height: 42,
      borderRadius: 14,
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: "center",
      justifyContent: "center",
    },
    modeBtnActive: { backgroundColor: c.primary, borderColor: c.primary },
    modeText: { color: c.text, fontWeight: "900" },
    modeTextActive: { color: "#fff" },

    refreshBtn: {
      width: 42,
      height: 42,
      borderRadius: 14,
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: "center",
      justifyContent: "center",
    },
    refreshText: { color: c.text, fontWeight: "900", fontSize: 16 },

    meta: { marginTop: 8, color: c.muted, fontWeight: "800" },

    loadingOverlay: {
      position: "absolute",
      left: 14,
      right: 14,
      bottom: 14,
      borderRadius: 16,
      padding: 12,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: "center",
      gap: 8,
    },
    loadingText: { color: c.muted, fontWeight: "800" },
  });
}
