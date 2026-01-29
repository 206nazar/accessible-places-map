import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { signOut } from "firebase/auth";
import { auth } from "../firebaseConfig";

export default function SideMenu({ visible, onClose, navigation, user, role }) {
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
        {/* натиск поза меню — закрити */}
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

        {/* саме меню */}
        <View style={styles.menu}>
          <Text style={styles.title}>Меню</Text>

          <Text style={styles.section}>Категорії</Text>
          <TouchableOpacity style={styles.item} onPress={() => alert("Фільтр: Заклади харчування (зробимо далі)")}>
            <Text style={styles.itemText}>🍽️ Заклади харчування</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.item} onPress={() => alert("Фільтр: Держ установи (зробимо далі)")}>
            <Text style={styles.itemText}>🏛️ Держ установи</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.item} onPress={() => alert("Фільтр: Медицина (зробимо далі)")}>
            <Text style={styles.itemText}>🏥 Медицина</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          <Text style={styles.section}>Акаунт</Text>
          <TouchableOpacity style={styles.item} onPress={() => go("Account")}>
            <Text style={styles.itemText}>👤 Профіль / Вхід</Text>
          </TouchableOpacity>

          {user && role === "company" ? (
            <TouchableOpacity style={styles.item} onPress={() => go("CompanyHome")}>
              <Text style={styles.itemText}>🏢 Кабінет компанії</Text>
            </TouchableOpacity>
          ) : null}

          {user ? (
            <TouchableOpacity style={[styles.item, styles.danger]} onPress={onLogout}>
              <Text style={[styles.itemText, styles.dangerText]}>🚪 Вийти</Text>
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeText}>Закрити</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, flexDirection: "row" },
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)" },

  menu: {
    width: 280,
    backgroundColor: "#fff",
    paddingTop: 18,
    paddingHorizontal: 14,
    paddingBottom: 14,
    borderTopRightRadius: 18,
    borderBottomRightRadius: 18,
  },

  title: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },
  section: { marginTop: 10, marginBottom: 6, color: "gray", fontWeight: "700" },

  item: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: "#f6f6f6",
    marginBottom: 8,
  },
  itemText: { fontWeight: "600" },

  divider: { height: 1, backgroundColor: "#eee", marginVertical: 10 },

  danger: { backgroundColor: "#fff0f0", borderWidth: 1, borderColor: "#ffd0d0" },
  dangerText: { color: "#b00020" },

  closeBtn: { marginTop: 10, paddingVertical: 12, alignItems: "center" },
  closeText: { color: "gray", fontWeight: "700" },
});
