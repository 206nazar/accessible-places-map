import { Modal, StyleSheet, Text, TouchableOpacity, View, Switch } from "react-native";
import { signOut } from "firebase/auth";
import { auth } from "../firebaseConfig";
import { useTheme } from "../theme/ThemeContext";

export default function SideMenu({ visible, onClose, navigation, user, role }) {
  const { theme, mode, toggleTheme } = useTheme();
  const c = theme.colors;

  const go = (screen) => {
    onClose();
    navigation.navigate(screen);
  };

  const onLogout = async () => {
    try {
      await signOut(auth);
      onClose();
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <TouchableOpacity style={[styles.backdrop, { backgroundColor: c.overlay }]} activeOpacity={1} onPress={onClose} />

        <View style={[styles.menu, { backgroundColor: c.surface, borderColor: c.border }]}>
          <Text style={[styles.title, { color: c.text }]}>Меню</Text>

          <Text style={[styles.section, { color: c.muted }]}>Акаунт</Text>

          <TouchableOpacity style={[styles.item, { backgroundColor: c.card }]} onPress={() => go("Account")}>
            <Text style={[styles.itemText, { color: c.text }]}>👤 Профіль / Вхід</Text>
          </TouchableOpacity>

          {user && role === "company" ? (
            <TouchableOpacity style={[styles.item, { backgroundColor: c.card }]} onPress={() => go("CompanyHome")}>
              <Text style={[styles.itemText, { color: c.text }]}>🏢 Кабінет компанії</Text>
            </TouchableOpacity>
          ) : null}

          {user ? (
            <TouchableOpacity
              style={[styles.item, { backgroundColor: c.dangerBg, borderWidth: 1, borderColor: c.dangerBorder }]}
              onPress={onLogout}
            >
              <Text style={[styles.itemText, { color: c.dangerText }]}>🚪 Вийти</Text>
            </TouchableOpacity>
          ) : null}

          <View style={[styles.divider, { backgroundColor: c.border }]} />

          <Text style={[styles.section, { color: c.muted }]}>Налаштування</Text>

          <View style={[styles.switchRow, { backgroundColor: c.card }]}>
            <Text style={[styles.itemText, { color: c.text }]}>🌙 Темна тема</Text>
            <Switch value={mode === "dark"} onValueChange={toggleTheme} />
          </View>

          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={[styles.closeText, { color: c.muted }]}>Закрити</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, flexDirection: "row" },
  backdrop: { flex: 1 },

  menu: {
    width: 280,
    paddingTop: 18,
    paddingHorizontal: 14,
    paddingBottom: 14,
    borderLeftWidth: 1,
  },

  title: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },
  section: { marginTop: 10, marginBottom: 6, fontWeight: "700" },

  item: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginBottom: 8,
  },
  itemText: { fontWeight: "600" },

  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 12,
  },

  divider: { height: 1, marginVertical: 10 },

  closeBtn: { marginTop: 14, paddingVertical: 12, alignItems: "center" },
  closeText: { fontWeight: "700" },
});
