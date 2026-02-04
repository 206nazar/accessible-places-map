import { useRef } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { collection, getDocs, limit, query, where } from "firebase/firestore";
import { db } from "../firebaseConfig";

const DEFAULT_REGION = {
  latitude: 50.6199,
  longitude: 26.2516,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

export default function MapScreen({ navigation, places }) {
  const mapRef = useRef(null);

  return (
    <View style={styles.container}>
      {Platform.OS === "web" ? (
        <Text style={styles.webText}>Карта працює на Android (react-native-maps не підтримує Web).</Text>
      ) : (
        <MapView ref={mapRef} style={styles.map} initialRegion={DEFAULT_REGION}>
          {places.map((p) => (
            <Marker
              key={p.id}
              coordinate={{ latitude: p.latitude, longitude: p.longitude }}
              title={p.title}
              description={p.description || "Відповідає нормам доступності"}
              pinColor="green"
              onPress={() => navigation.navigate("PlaceDetails", { placeId: p.id })}
            />
          ))}
        </MapView>
      )}
    </View>
  );
}

// ✅ category: "all" | "food" | "gov" | ...
export async function fetchPlaces(category = "all") {
  const base = [
    where("status", "==", "approved"),
  ];

  if (category && category !== "all") {
    base.push(where("category", "==", category));
  }

  const q = query(collection(db, "places"), ...base, limit(200));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  map: { flex: 1 },
  webText: { flex: 1, textAlign: "center", textAlignVertical: "center", color: "gray", paddingHorizontal: 20, fontSize: 16 },
});
