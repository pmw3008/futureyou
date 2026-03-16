import React, { useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ListRenderItemInfo,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, spacing, radius, shadows, typography, fonts } from "../../theme";
import { streamChatCompletion, buildSystemPrompt } from "../../utils";
import type { ChatMessage } from "../../utils";
import { useUserProfile } from "../../context/UserProfileContext";
import { useRitual } from "../../context/RitualContext";

interface DisplayMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  isError?: boolean;
}

const PROMPTS = [
  "What's my one focus right now?",
  "Give me tonight's reframe",
  "How do I hold my standard today?",
  "What evidence should I look for?",
];

export default function ChatScreen() {
  const { profile } = useUserProfile();
  const { standard, getRecentEvidence, completeStep, ritual } = useRitual();
  const systemPrompt = buildSystemPrompt(profile, {
    standard,
    recentEvidence: getRecentEvidence(5),
  });
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const sendMessage = useCallback(
    async (overrideText?: string) => {
      const text = (overrideText ?? input).trim();
      if (!text || isStreaming) return;

      const userMessage: DisplayMessage = {
        id: Date.now().toString(),
        role: "user",
        content: text,
      };
      const assistantMessage: DisplayMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "",
      };

      setInput("");
      setMessages((prev) => [...prev, userMessage, assistantMessage]);
      setIsStreaming(true);

      const apiMessages: ChatMessage[] = [
        { role: "system", content: systemPrompt },
        ...messages.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
        { role: "user" as const, content: text },
      ];

      try {
        await streamChatCompletion({
          messages: apiMessages,
          onToken: (token) => {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMessage.id
                  ? { ...m, content: m.content + token }
                  : m
              )
            );
          },
          onDone: () => setIsStreaming(false),
          onError: (error) => {
            const errorMsg = error.message.includes("API key")
              ? "Add your OpenAI API key in .env to connect with your future self."
              : "I couldn't reach you right now. Try again in a moment.";
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMessage.id
                  ? { ...m, content: errorMsg, isError: true }
                  : m
              )
            );
            setIsStreaming(false);
          },
        });
      } catch {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMessage.id
              ? { ...m, content: "Something went wrong. Try again.", isError: true }
              : m
          )
        );
        setIsStreaming(false);
      }
    },
    [input, isStreaming, messages, systemPrompt]
  );

  const renderMessage = useCallback(
    ({ item }: ListRenderItemInfo<DisplayMessage>) => {
      const isUser = item.role === "user";
      const isTyping = !isUser && item.content === "" && !item.isError;

      return (
        <View
          style={[
            styles.messageBubble,
            isUser ? styles.userBubble : styles.aiBubble,
          ]}
        >
          {!isUser && (
            <View style={styles.aiAvatar}>
              <Text style={styles.aiAvatarText}>✦</Text>
            </View>
          )}
          <View
            style={[
              styles.bubbleContent,
              isUser ? styles.userBubbleContent : styles.aiBubbleContent,
              item.isError && styles.errorBubbleContent,
            ]}
          >
            {isTyping ? (
              <View style={styles.typingContainer}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.typingText}>Reflecting...</Text>
              </View>
            ) : (
              <Text
                style={[
                  styles.messageText,
                  isUser ? styles.userMessageText : styles.aiMessageText,
                  item.isError && styles.errorMessageText,
                ]}
              >
                {item.content}
              </Text>
            )}
          </View>
        </View>
      );
    },
    []
  );

  const handlePromptPress = useCallback(
    (prompt: string) => {
      sendMessage(prompt);
    },
    [sendMessage]
  );

  const renderEmpty = useCallback(
    () => (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyGlow} />
        <View style={styles.emptyAvatar}>
          <Text style={styles.emptyAvatarText}>✦</Text>
        </View>
        <Text style={styles.emptyTitle}>Your Future Self</Text>
        <Text style={styles.emptySubtitle}>
          Ask a question and receive actionable guidance{"\n"}
          from the person you're becoming.
        </Text>

        {/* Standard context */}
        {standard && (
          <View style={styles.standardBanner}>
            <Text style={styles.standardLabel}>TODAY'S FOCUS</Text>
            <Text style={styles.standardValue}>{standard.focus}</Text>
          </View>
        )}

        <View style={styles.promptsContainer}>
          {PROMPTS.map((prompt) => (
            <Pressable
              key={prompt}
              style={({ pressed }) => [
                styles.promptChip,
                pressed && styles.promptChipPressed,
              ]}
              onPress={() => handlePromptPress(prompt)}
            >
              <Text style={styles.promptChipText}>{prompt}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    ),
    [handlePromptPress, standard]
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>Future Self</Text>
          <Text style={styles.headerSubtitle}>
            Actionable guidance from who you're becoming
          </Text>
        </View>

        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.messageList,
            messages.length === 0 && styles.messageListEmpty,
          ]}
          ListEmptyComponent={renderEmpty}
          onContentSizeChange={() =>
            messages.length > 0 &&
            flatListRef.current?.scrollToEnd({ animated: true })
          }
        />

        <View style={styles.inputBar}>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="Ask your future self..."
              placeholderTextColor={colors.textMuted}
              value={input}
              onChangeText={setInput}
              multiline
              maxLength={500}
              editable={!isStreaming}
              onSubmitEditing={() => sendMessage()}
              blurOnSubmit
            />
            <Pressable
              onPress={() => sendMessage()}
              disabled={!input.trim() || isStreaming}
              style={({ pressed }) => [
                styles.sendButton,
                (!input.trim() || isStreaming) && styles.sendButtonDisabled,
                pressed && styles.sendButtonPressed,
              ]}
            >
              <Text style={styles.sendIcon}>↑</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },

  headerContainer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: { ...typography.headline, fontSize: 24, marginBottom: spacing.xs },
  headerSubtitle: { ...typography.caption, fontSize: 13, color: colors.textMuted },

  messageList: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    paddingTop: spacing.lg,
  },
  messageListEmpty: { flex: 1, justifyContent: "center" },

  emptyContainer: { alignItems: "center", paddingHorizontal: spacing.xl },
  emptyGlow: {
    position: "absolute",
    top: -40,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: colors.primary,
    opacity: 0.06,
  },
  emptyAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing["2xl"],
    ...shadows.glow,
  },
  emptyAvatarText: { fontSize: 26, color: "#FFFFFF" },
  emptyTitle: { ...typography.headline, fontSize: 24, marginBottom: spacing.sm },
  emptySubtitle: {
    ...typography.editorial,
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 23,
    marginBottom: spacing.xl,
  },

  standardBanner: {
    backgroundColor: colors.surface,
    borderRadius: radius.medium,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    width: "100%",
  },
  standardLabel: {
    fontFamily: fonts.body,
    fontSize: 10,
    letterSpacing: 2,
    color: colors.primary,
    textTransform: "uppercase",
    marginBottom: spacing.xs,
  },
  standardValue: {
    ...typography.body,
    fontSize: 14,
    color: colors.textPrimary,
  },

  promptsContainer: { width: "100%", gap: spacing.md },
  promptChip: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.medium,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    alignItems: "center",
  },
  promptChipPressed: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  promptChipText: { ...typography.body, fontSize: 14, color: colors.textSecondary },

  messageBubble: {
    marginBottom: spacing.xl,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  userBubble: { justifyContent: "flex-end" },
  aiBubble: { justifyContent: "flex-start" },
  aiAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.sm,
    marginTop: 2,
  },
  aiAvatarText: { fontSize: 14, color: "#FFFFFF" },
  bubbleContent: {
    maxWidth: "78%",
    borderRadius: radius.large,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  userBubbleContent: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: radius.small,
    ...shadows.glow,
  },
  aiBubbleContent: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomLeftRadius: radius.small,
  },
  errorBubbleContent: {
    borderColor: colors.coral,
    backgroundColor: "rgba(255,107,74,0.08)",
  },
  messageText: { ...typography.body, fontSize: 15, lineHeight: 23 },
  userMessageText: { fontFamily: fonts.body, color: "#FFFFFF" },
  aiMessageText: { color: colors.textPrimary },
  errorMessageText: { color: colors.textSecondary, fontStyle: "italic" },

  typingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: 2,
  },
  typingText: {
    ...typography.body,
    fontSize: 14,
    color: colors.textMuted,
    fontStyle: "italic",
  },

  inputBar: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: colors.surface,
    borderRadius: radius.large,
    borderWidth: 1,
    borderColor: colors.border,
    paddingLeft: spacing.lg,
    paddingRight: spacing.xs,
    paddingVertical: spacing.xs,
  },
  textInput: {
    flex: 1,
    ...typography.body,
    fontSize: 15,
    color: colors.textPrimary,
    maxHeight: 100,
    paddingVertical: spacing.sm,
  },
  sendButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: spacing.sm,
    marginBottom: 2,
    ...shadows.glow,
  },
  sendButtonDisabled: { backgroundColor: colors.warmBeige },
  sendButtonPressed: { transform: [{ scale: 0.94 }] },
  sendIcon: { fontFamily: fonts.headline, fontSize: 18, color: "#FFFFFF" },
});
