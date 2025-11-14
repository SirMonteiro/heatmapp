import { TextStyle, ViewStyle } from "react-native"
import Feather from "@expo/vector-icons/Feather"
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons"
import { BottomTabScreenProps, createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { CompositeScreenProps } from "@react-navigation/native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { Icon } from "@/components/Icon"
import { EpisodeProvider } from "@/context/EpisodeContext"
import { translate } from "@/i18n/translate"
import { PerfilStack } from "@/navigators/PerfilStack"
import { DemoCommunityScreen } from "@/screens/DemoCommunityScreen"
import { DemoDebugScreen } from "@/screens/DemoDebugScreen"
import { DemoPodcastListScreen } from "@/screens/DemoPodcastListScreen"
import { DemoShowroomScreen } from "@/screens/DemoShowroomScreen/DemoShowroomScreen"
import { Loja } from "@/screens/Loja"
import { MapScreen } from "@/screens/MapScreen"
// import { Perfil } from "@/screens/Perfil"
import { Sobre } from "@/screens/Sobre"
import { TelaTeste } from "@/screens/TelaTeste"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

import { AppStackParamList, AppStackScreenProps } from "./AppNavigator"
import { ConfiguracoesNavigator } from "./ConfiguracoesNavigator"

export type DemoTabParamList = {
  DemoCommunity: undefined
  DemoShowroom: { queryIndex?: string; itemIndex?: string }
  DemoDebug: undefined
  DemoPodcastList: undefined
  DemoMap: undefined
  TelaTeste: undefined
  Configuracoes: undefined
  Loja: undefined
  Perfil: undefined
  IconChangeScreen: undefined
}

/**
 * Helper for automatically generating navigation prop types for each route.
 *
 * More info: https://reactnavigation.org/docs/typescript/#organizing-types
 */
export type DemoTabScreenProps<T extends keyof DemoTabParamList> = CompositeScreenProps<
  BottomTabScreenProps<DemoTabParamList, T>,
  AppStackScreenProps<keyof AppStackParamList>
>

const Tab = createBottomTabNavigator<DemoTabParamList>()

/**
 * This is the main navigator for the demo screens with a bottom tab bar.
 * Each tab is a stack navigator with its own set of screens.
 *
 * More info: https://reactnavigation.org/docs/bottom-tab-navigator/
 * @returns {JSX.Element} The rendered `DemoNavigator`.
 */
export function DemoNavigator() {
  const { bottom } = useSafeAreaInsets()
  const {
    themed,
    theme: { colors },
  } = useAppTheme()

  return (
    <EpisodeProvider>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarHideOnKeyboard: true,
          tabBarStyle: themed([$tabBar, { height: bottom + 70 }]),
          tabBarActiveTintColor: colors.text,
          tabBarInactiveTintColor: colors.text,
          tabBarLabelStyle: themed($tabBarLabel),
          tabBarItemStyle: themed($tabBarItem),
        }}
      >
        {/* <Tab.Screen
          name="DemoShowroom"
          component={DemoShowroomScreen}
          options={{
            tabBarLabel: translate("demoNavigator:componentsTab"),
            tabBarIcon: ({ focused }) => (
              <Icon
                icon="components"
                color={focused ? colors.tint : colors.tintInactive}
                size={30}
              />
            ),
          }}
        /> */}

        {/* <Tab.Screen
          name="DemoCommunity"
          component={DemoCommunityScreen}
          options={{
            tabBarLabel: translate("demoNavigator:communityTab"),
            tabBarIcon: ({ focused }) => (
              <Icon
                icon="community"
                color={focused ? colors.tint : colors.tintInactive}
                size={30}
              />
            ),
          }}
        /> */}

        {/* <Tab.Screen
          name="DemoPodcastList"
          component={DemoPodcastListScreen}
          options={{
            tabBarAccessibilityLabel: translate("demoNavigator:podcastListTab"),
            tabBarLabel: translate("demoNavigator:podcastListTab"),
            tabBarIcon: ({ focused }) => (
              <Icon icon="podcast" color={focused ? colors.tint : colors.tintInactive} size={30} />
            ),
          }}
        /> */}

        {/* <Tab.Screen
          name="DemoDebug"
          component={DemoDebugScreen}
          options={{
            tabBarLabel: translate("demoNavigator:debugTab"),
            tabBarIcon: ({ focused }) => (
              <Icon icon="debug" color={focused ? colors.tint : colors.tintInactive} size={30} />
            ),
          }}
        /> */}

        <Tab.Screen
          name="DemoMap"
          component={MapScreen}
          options={{
            tabBarLabel: "Mapa",
            tabBarIcon: ({ focused }) => (
              <MaterialCommunityIcons
                name="map"
                color={focused ? colors.tint : colors.tintInactive}
                size={30}
              />
            ),
          }}
        />

        {/* <Tab.Screen
          name="TelaTeste"
          component={TelaTeste}
          options={{
            tabBarLabel: "TelaTeste",
            tabBarIcon: ({ focused }) => (
              <Icon icon="debug" color={focused ? colors.tint : colors.tintInactive} size={30} />
            ),
          }}
        /> */}

        <Tab.Screen
          name="Loja"
          component={Loja}
          options={{
            tabBarLabel: "Loja",
            tabBarIcon: ({ focused }) => (
              <MaterialCommunityIcons
                name="store"
                color={focused ? colors.tint : colors.tintInactive}
                size={30}
              />
            ),
          }}
        />

        <Tab.Screen
          name="Perfil"
          component={PerfilStack}
          options={{
            tabBarLabel: "Perfil",
            tabBarIcon: ({ focused }) => (
              <Feather name="user" size={24} color={focused ? colors.tint : colors.tintInactive} />
            ),
          }}
        />

        <Tab.Screen
          name="Configuracoes"
          component={ConfiguracoesNavigator}
          options={{
            tabBarLabel: "Configurações",
            tabBarIcon: ({ focused }) => (
              <Icon icon="settings" color={focused ? colors.tint : colors.tintInactive} size={30} />
            ),
          }}
        />
      </Tab.Navigator>
    </EpisodeProvider>
  )
}

const $tabBar: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.background,
  borderTopColor: colors.transparent,
})

const $tabBarItem: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingTop: spacing.md,
})

const $tabBarLabel: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontSize: 12,
  fontFamily: typography.primary.medium,
  lineHeight: 16,
  color: colors.text,
})
