import { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { onAuthStateChanged } from "firebase/auth";

import { auth } from "./firebaseConfig";

import HomeScreen from "./screens/HomeScreen";
import CompanyHomeScreen from "./screens/CompanyHomeScreen";
import AccountScreen from "./screens/AccountScreen";
import LoginScreen from "./screens/LoginScreen";
import RegisterScreen from "./screens/RegisterScreen";
import RoleSelectScreen from "./screens/RoleSelectScreen";
import AddPlaceScreen from "./screens/AddPlaceScreen";
import PlaceDetailsScreen from "./screens/PlaceDetailsScreen";
import EditPlaceScreen from "./screens/EditPlaceScreen";

import { ThemeProvider, useTheme } from "./theme/ThemeContext";

const Stack = createNativeStackNavigator();

function AppInner() {
  const [user, setUser] = useState(null);
  const [readyAuth, setReadyAuth] = useState(false);

  const { theme, ready: readyTheme } = useTheme();

  // ✅ fallback, щоб НЕ падало навіть якщо theme/ colors десь undefined
  const colors = theme?.colors ?? {
    bg: "#ffffff",
    surface: "#ffffff",
    text: "#111111",
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u || null);
      setReadyAuth(true);
    });
    return unsub;
  }, []);

  if (!readyAuth || !readyTheme) return null;

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="Home" options={{ headerShown: false }}>
          {(props) => <HomeScreen {...props} user={user} />}
        </Stack.Screen>

        <Stack.Screen name="CompanyHome" options={{ title: "Кабінет компанії" }}>
          {(props) => <CompanyHomeScreen {...props} user={user} />}
        </Stack.Screen>

        <Stack.Screen name="Account" component={AccountScreen} options={{ title: "Акаунт" }} />
        <Stack.Screen name="Login" component={LoginScreen} options={{ title: "Вхід" }} />
        <Stack.Screen name="Register" component={RegisterScreen} options={{ title: "Реєстрація" }} />
        <Stack.Screen name="RoleSelect" component={RoleSelectScreen} options={{ title: "Хто ви?" }} />

        <Stack.Screen name="PlaceDetails" component={PlaceDetailsScreen} options={{ title: "Місце" }} />

        <Stack.Screen name="AddPlace" component={AddPlaceScreen} options={{ title: "Додати місце" }} />
        <Stack.Screen name="EditPlace" component={EditPlaceScreen} options={{ title: "Редагувати місце" }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppInner />
    </ThemeProvider>
  );
}
