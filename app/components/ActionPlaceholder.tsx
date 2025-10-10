import { FC } from "react"
import { TextStyle, ViewStyle } from "react-native"

import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

export interface ActionPlaceholderProps {
  /**
   * The action type that was triggered
   */
  actionType?: "audio" | "sintomas" | "area-verde"
}

/**
 * A placeholder component that displays a simple message.
 * This will be shown in a modal when action buttons are pressed.
 * @param {ActionPlaceholderProps} props - The props for the `ActionPlaceholder` component.
 * @returns {JSX.Element} The rendered `ActionPlaceholder` component.
 */
export const ActionPlaceholder: FC<ActionPlaceholderProps> = function ActionPlaceholder(props) {
  const { actionType } = props
  const { themed } = useAppTheme()

  const getMessageForAction = () => {
    switch (actionType) {
      case "audio":
        return "Funcionalidade de envio de áudio em desenvolvimento"
      case "sintomas":
        return "Funcionalidade de envio de sintomas em desenvolvimento"
      case "area-verde":
        return "Funcionalidade de reportar área verde em desenvolvimento"
      default:
        return "Hello World - Placeholder Component"
    }
  }

  return (
    <Screen
      preset="fixed"
      contentContainerStyle={themed($container)}
      safeAreaEdges={["top", "bottom"]}
    >
      <Text preset="heading" style={themed($heading)} text="Em Desenvolvimento" />
      <Text style={themed($message)} text={getMessageForAction()} />
    </Screen>
  )
}

const $container: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  justifyContent: "center",
  alignItems: "center",
  paddingHorizontal: spacing.lg,
})

const $heading: ThemedStyle<TextStyle> = ({ spacing }) => ({
  marginBottom: spacing.lg,
  textAlign: "center",
})

const $message: ThemedStyle<TextStyle> = ({ spacing }) => ({
  textAlign: "center",
  marginBottom: spacing.md,
})
