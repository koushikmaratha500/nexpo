import { useCallback, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { API_ROUTES, apiUrl, getApiErrorMessage } from '@nexpo/shared';
import { useAuthStore } from '../../../src/store/authStore';
import { Button } from '../../../src/components/ui/Button';
import { Card } from '../../../src/components/ui/Card';
import { ScreenHeader } from '../../../src/components/ui/ScreenHeader';
import { cn } from '../../../src/lib/cn';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}

const SUGGESTED = [
  'How much did I spend last month?',
  'Compare this month vs last month',
  'Forecast my cashflow for next month',
  'Find subscriptions I should cancel',
];

const WELCOME: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  text: "Hi! I'm Finlit, your finance copilot. Ask me about your spending, income, forecasts, or subscriptions.",
};

export default function AssistantScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const listRef = useRef<FlatList>(null);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || busy) return;

      const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: 'user', text: trimmed };
      setMessages((prev) => [...prev, userMsg]);
      setInput('');
      setBusy(true);

      try {
        const token = useAuthStore.getState().token;
        const response = await fetch(apiUrl(API_ROUTES.ai.chat), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            messages: [...messages.filter((m) => m.id !== 'welcome'), userMsg].map((m) => ({
              id: m.id,
              role: m.role,
              parts: [{ type: 'text', text: m.text }],
            })),
          }),
        });

        if (!response.ok) {
          throw new Error(await response.text());
        }

        const raw = await response.text();
        const textMatches = [...raw.matchAll(/"text":"((?:\\.|[^"\\])*)"/g)].map((m) =>
          m[1].replace(/\\n/g, '\n').replace(/\\"/g, '"')
        );
        const finalText = textMatches.join('').trim() || raw.slice(0, 2000).trim() || 'No response.';

        setMessages((prev) => [...prev, { id: `a-${Date.now()}`, role: 'assistant', text: finalText }]);
      } catch (err) {
        setMessages((prev) => [
          ...prev,
          { id: `e-${Date.now()}`, role: 'assistant', text: getApiErrorMessage(err, 'Assistant unavailable.') },
        ]);
      } finally {
        setBusy(false);
        setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
      }
    },
    [busy, messages]
  );

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={80}
    >
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerClassName="gap-sm p-lg pb-md"
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        ListHeaderComponent={
          <View className="mb-lg gap-md">
            <ScreenHeader title="AI Assistant" subtitle="Ask Finlit about your finances." />
            <View className="flex-row flex-wrap gap-sm">
              {SUGGESTED.map((prompt) => (
                <Pressable
                  key={prompt}
                  onPress={() => sendMessage(prompt)}
                  className="rounded-full border border-outline-variant bg-surface-container-low px-md py-sm active:bg-surface-container"
                >
                  <Text className="text-sm text-primary">{prompt}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <View className={cn('mb-sm', item.role === 'user' ? 'items-end' : 'items-start')}>
            <Card
              className={cn(
                'max-w-[85%] p-md',
                item.role === 'user' && 'bg-primary-container border-primary-container'
              )}
            >
              <Text
                className={cn(
                  'font-body-md leading-6',
                  item.role === 'user' ? 'text-on-primary-container' : 'text-on-surface'
                )}
              >
                {item.text}
              </Text>
            </Card>
          </View>
        )}
      />
      <View className="flex-row gap-sm border-t border-outline-variant bg-surface-container-lowest p-lg">
        <TextInput
          className="max-h-[100px] flex-1 rounded-lg border border-outline-variant bg-surface-container-low px-md py-sm font-body-md text-on-surface"
          value={input}
          onChangeText={setInput}
          placeholder="Ask Finlit..."
          placeholderTextColor="#45464d"
          editable={!busy}
          multiline
        />
        <Button title={busy ? '...' : 'Send'} onPress={() => sendMessage(input)} disabled={busy || !input.trim()} />
      </View>
    </KeyboardAvoidingView>
  );
}
