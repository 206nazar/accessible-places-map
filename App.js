import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { View } from "react-native";

import HomeScreen from "./screens/HomeScreen";
import CompanyHomeScreen from "./screens/CompanyHomeScreen";
import CompanyReviewsScreen from "./screens/CompanyReviewsScreen";
import AccountScreen from "./screens/AccountScreen";
import LoginScreen from "./screens/LoginScreen";
import RegisterScreen from "./screens/RegisterScreen";
import RoleSelectScreen from "./screens/RoleSelectScreen";
import AddPlaceScreen from "./screens/AddPlaceScreen";
import PlaceDetailsScreen from "./screens/PlaceDetailsScreen";
import EditPlaceScreen from "./screens/EditPlaceScreen";
import PickLocationScreen from "./screens/PickLocationScreen";

import MyProfileScreen from "./screens/MyProfileScreen";
import MyReviewsScreen from "./screens/MyReviewsScreen";

import AdminHomeScreen from "./screens/AdminHomeScreen";
import AdminPlacesScreen from "./screens/AdminPlacesScreen";
import AdminReviewsScreen from "./screens/AdminReviewsScreen";

import { ThemeProvider, useTheme } from "./theme/ThemeContext";
import { UserProvider, useUser } from "./context/UserContext";

const Stack = createNativeStackNavigator();

function AppInner() {
  const { theme, ready: readyTheme } = useTheme();
  const { ready: readyUser, user } = useUser();

  // простий “splash”, щоб нічого не смикалось
  if (!readyTheme || !readyUser) return <View style={{ flex: 1, backgroundColor: theme?.colors?.bg || "#000" }} />;

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

        <Stack.Screen name="CompanyReviews" options={{ title: "Відгуки компанії" }}>
          {(props) => <CompanyReviewsScreen {...props} user={user} />}
        </Stack.Screen>

        {/* Admin */}
        <Stack.Screen name="AdminHome" options={{ title: "Адмін" }}>
          {(props) => <AdminHomeScreen {...props} user={user} />}
        </Stack.Screen>
        <Stack.Screen name="AdminPlaces" options={{ title: "Адмін: точки" }}>
          {(props) => <AdminPlacesScreen {...props} user={user} />}
        </Stack.Screen>
        <Stack.Screen name="AdminReviews" options={{ title: "Адмін: відгуки" }}>
          {(props) => <AdminReviewsScreen {...props} user={user} />}
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

        <Stack.Screen name="Login" component={LoginScreen} options={{ title: "Вхід" }} />
        <Stack.Screen name="Register" component={RegisterScreen} options={{ title: "Реєстрація" }} />
        <Stack.Screen name="RoleSelect" component={RoleSelectScreen} options={{ title: "Хто ви?" }} />

        <Stack.Screen name="PlaceDetails" options={{ title: "Місце" }}>
          {(props) => <PlaceDetailsScreen {...props} user={user} />}
        </Stack.Screen>

        <Stack.Screen name="PickLocation" component={PickLocationScreen} options={{ title: "Вибір локації" }} />

        <Stack.Screen name="AddPlace" component={AddPlaceScreen} options={{ title: "Додати місце" }} />
        <Stack.Screen name="EditPlace" component={EditPlaceScreen} options={{ title: "Редагувати місце" }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <UserProvider>
        <AppInner />
      </UserProvider>
    </ThemeProvider>
  );
}
