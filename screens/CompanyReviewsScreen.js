import { useEffect, useMemo, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { collection, getDocs, orderBy, query, serverTimestamp, updateDoc, where, doc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { useTheme } from "../theme/ThemeContext";

export default function CompanyReviewsScreen({ navigation, user }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const styles = useMemo(() => makeStyles(c), [c]);

  const [items, setItems] = useState([]);
  const [replyDraft, setReplyDraft] = useState({}); // { [reviewId]: text }

  const load = async () => {
    if (!user) {
      navigation.navigate("Login");
      return;
    }

    const q = query(
      collection(db, "reviews"),
      where("ownerUid", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const snap = await getDocs(q);
    setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  };

  useEffect(() => {
    load().catch((e) => alert(e.message));
  }, [user?.uid]);

  const sendReply = async (reviewId) => {
    const text = (replyDraft[reviewId] || "").trim();
    if (!text) return alert("Напиши відповідь.");

    try {
      await updateDoc(doc(db, "reviews", reviewId), {
        reply: {
          text,
          createdAt: serverTimestamp(),
        },
      });
      setReplyDraft((p) => ({ ...p, [reviewId]: "" }));
      load().catch(() => {});
    } catch (e) {
      alert(e?.message || "Помилка відповіді");
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 20 }}>
      {items.length === 0 ? (
        <Text style={styles.muted}>Поки немає відгуків про ваші точки.</Text>
      ) : (
        items.map((r) => (
          <View key={r.id} style={styles.card}>
            <Text style={styles.place}>{r.placeTitle || "Точка"}</Text>

            <Text style={styles.title}>
              ⭐ {r.rating || 0} — {r.authorName || r.authorEmail || "Користувач"}
            </Text>

            <Text style={styles.text}>{r.text || "—"}</Text>

            {r.reply?.text ? (
              <View style={styles.replyBox}>
                <Text style={styles.replyTitle}>Ваша відповідь:</Text>
                <Text style={styles.replyText}>{r.reply.text}</Text>
              </View>
            ) : (
              <View style={{ marginTop: 10 }}>
                <Text style={styles.replyTitle}>Відповісти:</Text>
                <TextInput
                  style={styles.input}
                  value={replyDraft[r.id] || ""}
                  onChangeText={(t) => setReplyDraft((p) => ({ ...p, [r.id]: t }))}
                  placeholder="Напишіть відповідь..."
                  placeholderTextColor={c.muted}
                  multiline
                />
                <TouchableOpacity style={styles.btn} onPress={() => sendReply(r.id)}>
                  <Text style={styles.btnText}>Надіслати</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))
      )}
    </ScrollView>
  );
}

function makeStyles(c) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg, padding: 14 },
    muted: { color: c.muted, marginTop: 10 },

    card: {
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 16,
      padding: 12,
      marginBottom: 12,
    },

    place: { color: c.muted, fontWeight: "800" },
    title: { color: c.text, fontWeight: "900", marginTop: 6 },
    text: { color: c.text, marginTop: 8, lineHeight: 20 },

    replyBox: {
      marginTop: 10,
      padding: 10,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
    },
    replyTitle: { color: c.muted, fontWeight: "900" },
    replyText: { color: c.text, marginTop: 6 },

    input: {
      marginTop: 6,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
      color: c.text,
      borderRadius: 12,
      padding: 10,
      minHeight: 70,
    },

    btn: { marginTop: 10, backgroundColor: c.primary, padding: 12, borderRadius: 12, alignItems: "center" },
    btnText: { color: "#fff", fontWeight: "bold" },
  });
}
