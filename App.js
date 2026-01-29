import { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { onAuthStateChanged } from "firebase/auth";
import PlaceDetailsScreen from "./screens/PlaceDetailsScreen";

import { auth } from "./firebaseConfig";

import HomeScreen from "./screens/HomeScreen";
import CompanyHomeScreen from "./screens/CompanyHomeScreen";
import AccountScreen from "./screens/AccountScreen";
import LoginScreen from "./screens/LoginScreen";
import RegisterScreen from "./screens/RegisterScreen";
import RoleSelectScreen from "./screens/RoleSelectScreen";
import AddPlaceScreen from "./screens/AddPlaceScreen";

const Stack = createNativeStackNavigator();

export default function App() {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u || null);
      setReady(true);
    });
    return unsub;
  }, []);

  if (!ready) return null;

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        {/* Головний екран (карта/фільтри/кнопка акаунт) */}
        <Stack.Screen name="Home" options={{ headerShown: false }}>
          {(props) => <HomeScreen {...props} user={user} />}
        </Stack.Screen>

        {/* Кабінет компанії */}
        <Stack.Screen name="CompanyHome" options={{ title: "Кабінет компанії" }}>
          {(props) => <CompanyHomeScreen {...props} user={user} />}
        </Stack.Screen>

        {/* Акаунт/Вхід/Реєстрація */}
        <Stack.Screen name="Account" component={AccountScreen} options={{ title: "Акаунт" }} />
        <Stack.Screen name="Login" component={LoginScreen} options={{ title: "Вхід" }} />
        <Stack.Screen name="Register" component={RegisterScreen} options={{ title: "Реєстрація" }} />
        <Stack.Screen name="RoleSelect" component={RoleSelectScreen} options={{ title: "Хто ви?" }} />

        <Stack.Screen name="PlaceDetails" component={PlaceDetailsScreen} options={{ title: "Місце" }} />

        {/* Додати місце */}
        <Stack.Screen name="AddPlace" component={AddPlaceScreen} options={{ title: "Додати місце" }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
