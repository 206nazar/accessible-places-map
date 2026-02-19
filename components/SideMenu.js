import { Modal, StyleSheet, Text, TouchableOpacity, View, Switch } from "react-native";
import { signOut } from "firebase/auth";
import { auth } from "../firebaseConfig";
import { useTheme } from "../theme/ThemeContext";

export default function SideMenu({ visible, onClose, navigation, user, role }) {
  const { mode, theme, setThemeMode } = useTheme();
  const c = theme.colors;
  const styles = makeStyles(c);

  const go = (screen, params) => {
    onClose?.();
    navigation.navigate(screen, params);
  };

  const onLogout = async () => {
    try {
      await signOut(auth);
      onClose?.();
      navigation.navigate("Home");
    } catch (e) {
      alert(e.message);
    }
  };

  const isAdmin = !!user && role === "admin";
  const isCompany = !!user && role === "company";

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

        <View style={styles.menu}>
          <Text style={styles.title}>Меню</Text>

          <Text style={styles.section}>Акаунт</Text>

          {isAdmin ? (
            <TouchableOpacity style={styles.item} onPress={() => go("AdminHome")}>
              <Text style={styles.itemText}>🛡️ Адмін панель</Text>
            </TouchableOpacity>
          ) : null}

          {isCompany ? (
            <>
              <TouchableOpacity style={styles.item} onPress={() => go("CompanyHome")}>
                <Text style={styles.itemText}>🏢 Кабінет компанії</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.item} onPress={() => go("CompanyReviews")}>
                <Text style={styles.itemText}>💬 Відгуки про мої точки</Text>
              </TouchableOpacity>
            </>
          ) : user ? (
            <>
              <TouchableOpacity style={styles.item} onPress={() => go("MyProfile")}>
                <Text style={styles.itemText}>👤 Мій профіль</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.item} onPress={() => go("MyReviews")}>
                <Text style={styles.itemText}>⭐ Мої відгуки</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity style={styles.item} onPress={() => go("Login")}>
                <Text style={styles.itemText}>🔐 Вхід</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.item} onPress={() => go("Register")}>
                <Text style={styles.itemText}>📝 Реєстрація</Text>
              </TouchableOpacity>
            </>
          )}

          {user ? (
            <TouchableOpacity style={[styles.item, styles.danger]} onPress={onLogout}>
              <Text style={[styles.itemText, styles.dangerText]}>🚪 Вийти</Text>
            </TouchableOpacity>
          ) : null}

          <View style={styles.divider} />

          <Text style={styles.section}>Налаштування</Text>
          <View style={styles.itemRow}>
            <Text style={styles.itemText}>🌙 Темна тема</Text>
            <Switch value={mode === "dark"} onValueChange={(v) => setThemeMode(v ? "dark" : "light")} />
          </View>

          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeText}>Закрити</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function makeStyles(c) {
  return StyleSheet.create({
    overlay: { flex: 1, flexDirection: "row" },
    backdrop: { flex: 1, backgroundColor: c.overlay },

    menu: {
      width: 300,
      backgroundColor: c.surface,
      paddingTop: 18,
      paddingHorizontal: 14,
      paddingBottom: 14,
      borderTopRightRadius: 18,
      borderBottomRightRadius: 18,
      borderLeftWidth: 1,
      borderLeftColor: c.border,
    },

    title: { fontSize: 18, fontWeight: "900", marginBottom: 10, color: c.text },
    section: { marginTop: 10, marginBottom: 6, color: c.muted, fontWeight: "800" },

    item: {
      paddingVertical: 12,
      paddingHorizontal: 10,
      borderRadius: 14,
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.border,
      marginBottom: 8,
    },
    itemText: { fontWeight: "800", color: c.text },

    itemRow: {
      paddingVertical: 12,
      paddingHorizontal: 10,
      borderRadius: 14,
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.border,
      marginBottom: 8,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },

    divider: { height: 1, backgroundColor: c.border, marginVertical: 10 },

    danger: { backgroundColor: c.dangerBg, borderColor: c.dangerBorder },
    dangerText: { color: c.dangerText },

    closeBtn: { marginTop: 10, paddingVertical: 12, alignItems: "center" },
    closeText: { color: c.muted, fontWeight: "800" },
  });
}
