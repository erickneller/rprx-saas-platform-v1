import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { LifeBuoy, Search, Send, MessageCircle, Bug, Lightbulb, HelpCircle } from 'lucide-react';
import { AuthenticatedLayout } from '@/components/layout/AuthenticatedLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useUserGuide } from '@/hooks/useUserGuide';
import { useSubmitSupportRequest, type SupportRequestType } from '@/hooks/useSupportRequests';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';
import { toast } from 'sonner';

type HelpRequestType = Exclude<SupportRequestType, 'advisor'>;

const TYPE_META: Record<HelpRequestType, { label: string; description: string; icon: any }> = {
  help: { label: 'General help / question', description: 'Ask a question and we will get back to you.', icon: HelpCircle },
  bug: { label: 'Report a bug', description: 'Something looks broken or behaves unexpectedly.', icon: Bug },
  feature: { label: 'Request a feature', description: 'Suggest an improvement or new capability.', icon: Lightbulb },
};

const HELP_REQUEST_TYPES: HelpRequestType[] = ['help', 'bug', 'feature'];

export default function Help() {
  const navigate = useNavigate();
  const { data: sections = [], isLoading } = useUserGuide(true);
  const submit = useSubmitSupportRequest();
  const { enabled: chatEnabled } = useFeatureFlag('chat_enabled');

  const [query, setQuery] = useState('');
  const [type, setType] = useState<HelpRequestType>('help');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sections;
    return sections.filter(
      (s) => s.title.toLowerCase().includes(q) || s.body.toLowerCase().includes(q)
    );
  }, [sections, query]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      toast.error('Please add a subject and message');
      return;
    }
    try {
      await submit.mutateAsync({
        type,
        subject: subject.trim().slice(0, 120),
        message: message.trim().slice(0, 2000),
        page_url: window.location.href,
        user_agent: navigator.userAgent,
      });
      toast.success("Thanks! We've received your request.");
      setSubject('');
      setMessage('');
    } catch (e: any) {
      toast.error(e?.message ? `Failed: ${e.message}` : 'Failed to submit');
    }
  };

  const TypeIcon = TYPE_META[type].icon;

  return (
    <AuthenticatedLayout>
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <LifeBuoy className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Help & Support</h1>
            <p className="text-sm text-muted-foreground">Browse the guide or send us a direct request.</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          {/* Searchable user guide */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">User Guide</CardTitle>
              <CardDescription>Search articles to optimize your RPRx experience.</CardDescription>
              <div className="relative pt-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 mt-1 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search guide…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </CardHeader>
            <CardContent>
              {isLoading && <p className="text-sm text-muted-foreground py-6 text-center">Loading…</p>}
              {!isLoading && filtered.length === 0 && (
                <p className="text-sm text-muted-foreground py-6 text-center">
                  {sections.length === 0 ? 'No guide content yet.' : 'No matches for that search.'}
                </p>
              )}
              {filtered.length > 0 && (
                <Accordion type="multiple" className="space-y-1">
                  {filtered.map((s) => (
                    <AccordionItem key={s.id} value={s.id} className="border rounded-md px-3">
                      <AccordionTrigger className="hover:no-underline text-left">
                        <span className="font-medium">{s.title}</span>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                          <ReactMarkdown>{s.body}</ReactMarkdown>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </CardContent>
          </Card>

          {/* Request form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Send a Request</CardTitle>
              <CardDescription>How can we help you optimize today?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Type of request</Label>
                <Select value={type} onValueChange={(v) => setType(v as HelpRequestType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {HELP_REQUEST_TYPES.map((k) => {
                      const Icon = TYPE_META[k].icon;
                      return (
                        <SelectItem key={k} value={k}>
                          <span className="flex items-center gap-2">
                            <Icon className="h-4 w-4" /> {TYPE_META[k].label}
                          </span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <TypeIcon className="h-3.5 w-3.5" /> {TYPE_META[type].description}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value.slice(0, 120))}
                    placeholder="Short summary"
                    maxLength={120}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="message">Details</Label>
                  <Textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value.slice(0, 2000))}
                    placeholder={
                      type === 'bug'
                        ? 'What happened? What did you expect? Steps to reproduce…'
                        : type === 'feature'
                        ? 'Describe the feature and why it would help you.'
                        : 'Tell us how we can help.'
                    }
                    rows={6}
                    maxLength={2000}
                    required
                  />
                  <p className="text-xs text-muted-foreground text-right">{message.length}/2000</p>
                </div>
                <Button type="submit" disabled={submit.isPending} className="w-full gap-2">
                  <Send className="h-4 w-4" />
                  {submit.isPending ? 'Sending…' : 'Send Request'}
                </Button>

                {type === 'help' && chatEnabled && (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full gap-2"
                    onClick={() => navigate('/strategy-assistant')}
                  >
                    <MessageCircle className="h-4 w-4" /> Or ask the RPRx Assistant
                  </Button>
                )}
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
