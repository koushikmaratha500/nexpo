import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { API_ROUTES, apiPost, apiUpload } from '@nexpo/shared';
import { useToast } from '../../src/hooks/useToast';
import { Button } from '../../src/components/ui/Button';
import { Card } from '../../src/components/ui/Card';
import { Input } from '../../src/components/ui/Input';
import { ScreenHeader } from '../../src/components/ui/ScreenHeader';
import { PageShell } from '../../src/components/layout/PageShell';

const FAQ_CATEGORIES: Record<string, { title: string; faqs: { question: string; answer: string }[] }> = {
  account: {
    title: 'Account & Settings',
    faqs: [
      {
        question: 'How do I update my profile details?',
        answer: 'Open Settings to update your name, username, country, and currency.',
      },
      {
        question: 'Is email verification required?',
        answer: 'Yes, email verification ensures account security.',
      },
    ],
  },
  billing: {
    title: 'Billing & Invoices',
    faqs: [
      {
        question: 'How do I check my remaining ledger credits?',
        answer: 'Dashboard and Reports show your spend and deposits in real time.',
      },
      {
        question: 'Can I export invoice reports?',
        answer: 'Use Reports to filter by category and date, then export CSV.',
      },
    ],
  },
  technical: {
    title: 'Technical Support',
    faqs: [
      {
        question: 'What file formats are supported for receipt uploads?',
        answer: 'PDF, PNG, and JPEG up to 10MB.',
      },
      {
        question: 'Why is my upload failing?',
        answer: 'Check file size and format, then verify your network connection.',
      },
    ],
  },
};

export default function SupportScreen() {
  const { success, error } = useToast();
  const [category, setCategory] = useState('account');
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [attachment, setAttachment] = useState<{ url: string; name: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [successState, setSuccessState] = useState(false);

  const pickAttachment = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/png', 'image/jpeg'],
      copyToCacheDirectory: true,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    if (asset.size && asset.size > 10 * 1024 * 1024) {
      error('File must be under 10MB');
      return;
    }
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: asset.uri,
        name: asset.name,
        type: asset.mimeType || 'application/octet-stream',
      } as unknown as Blob);
      formData.append('bucket', 'nexpo');
      const res = await apiUpload<{ url: string }>('POST', API_ROUTES.upload, formData);
      setAttachment({ url: res.url, name: asset.name });
      success('Attachment uploaded.');
    } catch {
      error('Attachment upload failed.');
    }
  };

  const submitTicket = async () => {
    if (!name.trim() || !email.trim() || message.trim().length < 10) {
      error('Fill in name, email, and a message (10+ chars).');
      return;
    }
    setSubmitting(true);
    try {
      await apiPost(API_ROUTES.support, {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || null,
        message: message.trim(),
        attachmentUrl: attachment?.url || null,
        attachmentName: attachment?.name || null,
      });
      setSuccessState(true);
      setName('');
      setEmail('');
      setPhone('');
      setMessage('');
      setAttachment(null);
      success('Support ticket submitted.');
    } catch (err) {
      error(err instanceof Error ? err.message : 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const faqs = FAQ_CATEGORIES[category]?.faqs || [];

  return (
    <PageShell>
      <ScreenHeader title="Help Center" subtitle="FAQ and support tickets" />

      <View className="mb-lg flex-row flex-wrap gap-sm">
        {Object.entries(FAQ_CATEGORIES).map(([key, val]) => (
          <Button
            key={key}
            title={val.title.split(' ')[0]}
            variant={category === key ? 'primary' : 'secondary'}
            onPress={() => {
              setCategory(key);
              setOpenIndex(null);
            }}
            className="flex-grow"
          />
        ))}
      </View>

      <Card className="mb-lg gap-md">
        <Text className="font-title-md font-bold text-primary">{FAQ_CATEGORIES[category]?.title}</Text>
        {faqs.map((faq, index) => (
          <View key={faq.question} className="gap-sm">
            <Pressable
              onPress={() => setOpenIndex(openIndex === index ? null : index)}
              className="rounded-lg border border-outline-variant bg-surface-container-low px-md py-sm active:bg-surface-container"
            >
              <Text className="font-semibold text-on-surface">{faq.question}</Text>
            </Pressable>
            {openIndex === index && (
              <Text className="px-sm font-body-md leading-6 text-on-surface-variant">{faq.answer}</Text>
            )}
          </View>
        ))}
      </Card>

      <Card className="gap-md">
        <Text className="font-title-md font-bold text-primary">Contact support</Text>
        {successState && (
          <Text className="font-semibold text-secondary">Ticket submitted. We will respond by email.</Text>
        )}
        <Input label="Name" value={name} onChangeText={setName} />
        <Input label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        <Input label="Phone (optional)" value={phone} onChangeText={setPhone} />
        <Input label="Message" value={message} onChangeText={setMessage} multiline />
        <Button
          title={attachment ? `Attached: ${attachment.name}` : 'Attach file (optional)'}
          variant="secondary"
          onPress={pickAttachment}
        />
        <Button title="Submit ticket" loading={submitting} onPress={submitTicket} />
      </Card>
    </PageShell>
  );
}
