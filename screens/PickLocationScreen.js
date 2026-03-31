import { useMemo, useRef, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Platform, StatusBar } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { useTheme } from "../theme/ThemeContext";

export default function PickLocationScreen({ navigation, route }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const styles = useMemo(() => makeStyles(c), [c]);

  const mapRef = useRef(null);

  const initial = route?.params?.initial;
  const onPick = route?.params?.onPick; // ✅ callback з AddPlace

  const [picked, setPicked] = useState(initial || { latitude: 50.6199, longitude: 26.2516 });

  const region = useMemo(
    () => ({
      latitude: picked.latitude,
      longitude: picked.longitude,
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
    }),
    [picked]
  );

  const confirm = () => {
    // ✅ передаємо координати назад через callback (без navigate на AddPlace)
    if (typeof onPick === "function") onPick(picked);
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <View style={styles.topPadding} />

      <View style={styles.header}>
        <Text style={styles.title}>Виберіть точку</Text>
        <TouchableOpacity style={styles.doneBtn} onPress={confirm} activeOpacity={0.9}>
          <Text style={styles.doneText}>Готово</Text>
        </TouchableOpacity>
      </View>

      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        initialRegion={region}
        onPress={(e) => {
          const { latitude, longitude } = e.nativeEvent.coordinate;
          setPicked({ latitude, longitude });
        }}
      >
        <Marker coordinate={picked} />
      </MapView>

      <View style={styles.bottom}>
        <Text style={styles.coords}>
          {picked.latitude.toFixed(6)}, {picked.longitude.toFixed(6)}
        </Text>
        <Text style={styles.hint}>Тапни на карту, щоб змінити місце</Text>
      </View>
    </View>
  );
}

function makeStyles(c) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg },
    topPadding: { height: Platform.OS === "android" ? StatusBar.currentHeight : 0 },

    header: {
      height: 56,
      paddingHorizontal: 14,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: c.surface,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    title: { color: c.text, fontWeight: "900", fontSize: 16 },
    doneBtn: {
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 14,
      backgroundColor: c.primary,
    },
    doneText: { color: "#fff", fontWeight: "900" },

    bottom: {
      padding: 12,
      backgroundColor: c.surface,
      borderTopWidth: 1,
      borderTopColor: c.border,
    },
    coords: { color: c.text, fontWeight: "900", textAlign: "center" },
    hint: { color: c.muted, fontWeight: "700", textAlign: "center", marginTop: 4 },
  });
}