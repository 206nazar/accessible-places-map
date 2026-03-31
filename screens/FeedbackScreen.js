import { useMemo, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView } from "react-native";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebaseConfig";
import { useTheme } from "../theme/ThemeContext";

const TYPES = [
  { key: "proposal", label: "💡 Пропозиція" },
  { key: "complaint", label: "⚠️ Скарга" },
  { key: "bug", label: "🐞 Помилка" },
  { key: "other", label: "📝 Інше" },
];

export default function FeedbackScreen({ navigation }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const styles = useMemo(() => makeStyles(c), [c]);

  const me = auth.currentUser;

  const [type, setType] = useState("proposal");
  const [name, setName] = useState("");
  const [email, setEmail] = useState(me?.email || "");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const submit = async () => {
    if (!message.trim()) return alert("Напиши текст повідомлення.");
    if (message.trim().length < 5) return alert("Текст занадто короткий.");

    setSending(true);
    try {
      await addDoc(collection(db, "feedback"), {
        type,
        name: name.trim(),
        email: email.trim(),
        message: message.trim(),

        uid: me?.uid || null,

        // корисно для сортування/логів
        createdAt: serverTimestamp(),
        status: "new",
      });

      alert("Дякуємо! Повідомлення відправлено ✅");
      navigation.goBack();
    } catch (e) {
      console.log("feedback error:", e);
      alert(e?.message || "Помилка відправки");
    } finally {
      setSending(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 24 }}>
      <Text style={styles.title}>Зворотній звʼязок</Text>
      <Text style={styles.sub}>Напиши пропозицію або скаргу — це допоможе покращити додаток.</Text>

      <Text style={styles.label}>Тип</Text>
      <View style={styles.typeRow}>
        {TYPES.map((t) => {
          const active = t.key === type;
          return (
            <TouchableOpacity
              key={t.key}
              style={[styles.typeChip, active && styles.typeChipActive]}
              onPress={() => setType(t.key)}
              activeOpacity={0.9}
            >
              <Text style={[styles.typeChipText, active && styles.typeChipTextActive]} numberOfLines={1}>
                {t.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.label}>Імʼя (необовʼязково)</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Наприклад: Назар"
        placeholderTextColor={c.muted}
      />

      <Text style={styles.label}>Email (необовʼязково)</Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        placeholder="example@gmail.com"
        placeholderTextColor={c.muted}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <Text style={styles.label}>Повідомлення</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={message}
        onChangeText={setMessage}
        placeholder="Опиши проблему або пропозицію..."
        placeholderTextColor={c.muted}
        multiline
      />

      <TouchableOpacity style={styles.btn} onPress={submit} disabled={sending} activeOpacity={0.9}>
        {sending ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <ActivityIndicator />
            <Text style={styles.btnText}>Відправляю...</Text>
          </View>
        ) : (
          <Text style={styles.btnText}>Відправити</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

function makeStyles(c) {
  return StyleSheet.create({
    container: { flex: 1, padding: 16, backgroundColor: c.bg },
    title: { fontSize: 22, fontWeight: "900", color: c.text },
    sub: { marginTop: 6, color: c.muted, fontWeight: "700" },

    label: { marginTop: 12, marginBottom: 6, color: c.text, fontWeight: "900" },

    input: {
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
      color: c.text,
      borderRadius: 14,
      padding: 12,
    },
    textArea: { height: 140, textAlignVertical: "top" },

    typeRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
    typeChip: {
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 999,
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.border,
    },
    typeChipActive: { backgroundColor: c.primary, borderColor: c.primary },
    typeChipText: { color: c.text, fontWeight: "900" },
    typeChipTextActive: { color: "#fff" },

    btn: { marginTop: 16, backgroundColor: c.primary, paddingVertical: 14, borderRadius: 16, alignItems: "center" },
    btnText: { color: "#fff", fontWeight: "900" },
  });
}