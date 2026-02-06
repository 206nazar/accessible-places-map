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

import MyProfileScreen from "./screens/MyProfileScreen";
import MyReviewsScreen from "./screens/MyReviewsScreen";
import CompanyReviewsScreen from "./screens/CompanyReviewsScreen";
import ReviewEditScreen from "./screens/ReviewEditScreen";
import RouteScreen from "./screens/RouteScreen";


import { ThemeProvider, useTheme } from "./theme/ThemeContext";

const Stack = createNativeStackNavigator();

function AppInner() {
  const [user, setUser] = useState(null);
  const [readyAuth, setReadyAuth] = useState(false);

  const { theme, ready: readyTheme } = useTheme();

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
          headerStyle: { backgroundColor: theme.colors.surface },
          headerTintColor: theme.colors.text,
          contentStyle: { backgroundColor: theme.colors.bg },
        }}
      >
        <Stack.Screen name="Home" options={{ headerShown: false }}>
          {(props) => <HomeScreen {...props} user={user} />}
        </Stack.Screen>

        <Stack.Screen name="CompanyHome" options={{ title: "Кабінет компанії" }}>
          {(props) => <CompanyHomeScreen {...props} user={user} />}
        </Stack.Screen>

        <Stack.Screen name="CompanyReviews" options={{ title: "Відгуки про мої точки" }}>
          {(props) => <CompanyReviewsScreen {...props} user={user} />}
        </Stack.Screen>

        <Stack.Screen name="Account" options={{ title: "Акаунт" }}>
          {(props) => <AccountScreen {...props} user={user} />}
        </Stack.Screen>

        <Stack.Screen name="MyProfile" options={{ title: "Мій профіль" }}>
          {(props) => <MyProfileScreen {...props} user={user} />}
        </Stack.Screen>

        <Stack.Screen name="MyReviews" options={{ title: "Мої відгуки" }}>
          {(props) => <MyReviewsScreen {...props} user={user} />}
        </Stack.Screen>

        <Stack.Screen name="ReviewEdit" options={{ title: "Відгук" }}>
          {(props) => <ReviewEditScreen {...props} user={user} />}
        </Stack.Screen>

        <Stack.Screen name="Login">
          {(props) => <LoginScreen {...props} user={user} />}
        </Stack.Screen>

        <Stack.Screen name="Register">
          {(props) => <RegisterScreen {...props} user={user} />}
        </Stack.Screen>

        <Stack.Screen name="RoleSelect">
          {(props) => <RoleSelectScreen {...props} user={user} />}
        </Stack.Screen>

        <Stack.Screen name="PlaceDetails" options={{ title: "Місце" }}>
          {(props) => <PlaceDetailsScreen {...props} user={user} />}
        </Stack.Screen>

        <Stack.Screen name="Route" options={{ title: "Маршрут" }}>
          {(props) => <RouteScreen {...props} />}
        </Stack.Screen>

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
