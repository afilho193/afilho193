import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";
import { Feedback, FeedbackType } from "../types";
import { Button, Card, EmptyState, FeedbackTypeBadge } from "../components/ui";

interface DirectoryEntry {
  id: string;
  name: string;
  title: string | null;
  role: string;
}

const typeOptions: { value: FeedbackType; label: string }[] = [
  { value: "PRAISE", label: "Elogio" },
  { value: "CONSTRUCTIVE", label: "Feedback construtivo" },
  { value: "CHECKIN", label: "Check-in 1:1" },
];

export default function FeedbackPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"received" | "sent">("received");
  const [received, setReceived] = useState<Feedback[]>([]);
  const [sent, setSent] = useState<Feedback[]>([]);
  const [directory, setDirectory] = useState<DirectoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const [toUserId, setToUserId] = useState("");
  const [type, setType] = useState<FeedbackType>("PRAISE");
  const [message, setMessage] = useState("");
  const [actionItems, setActionItems] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function loadFeedback() {
    const data = await api.get<{ received: Feedback[]; sent: Feedback[] }>("/feedback");
    setReceived(data.received);
    setSent(data.sent);
  }

  useEffect(() => {
    Promise.all([loadFeedback(), api.get<DirectoryEntry[]>("/users/directory").then(setDirectory)]).finally(
      () => setLoading(false)
    );
  }, []);

  const availableRecipients = directory.filter((d) => d.id !== user?.id);
  const canCheckin = user?.role === "MANAGER" || user?.role === "HR";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!toUserId || !message.trim()) return;
    setSubmitting(true);
    try {
      await api.post("/feedback", {
        toUserId,
        type,
        message: message.trim(),
        actionItems: actionItems.trim() || undefined,
      });
      setMessage("");
      setActionItems("");
      setToUserId("");
      await loadFeedback();
      setTab("sent");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Erro ao enviar feedback");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="text-center text-slate-500">Carregando...</div>;

  const list = tab === "received" ? received : sent;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-4">
        <div>
          <h1 className="text-2xl font-bold">Feedback</h1>
          <p className="text-slate-500">Cultive uma cultura de feedback contínuo com sua equipe.</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setTab("received")}
            className={`rounded-full px-3 py-1 text-sm font-medium ${
              tab === "received" ? "bg-brand-600 text-white" : "bg-white text-slate-600 border border-slate-200"
            }`}
          >
            Recebidos ({received.length})
          </button>
          <button
            onClick={() => setTab("sent")}
            className={`rounded-full px-3 py-1 text-sm font-medium ${
              tab === "sent" ? "bg-brand-600 text-white" : "bg-white text-slate-600 border border-slate-200"
            }`}
          >
            Enviados ({sent.length})
          </button>
        </div>

        {list.length === 0 ? (
          <EmptyState text={tab === "received" ? "Você ainda não recebeu feedback." : "Você ainda não enviou feedback."} />
        ) : (
          <ul className="space-y-3">
            {list.map((f) => (
              <Card key={f.id}>
                <div className="mb-2 flex items-center justify-between">
                  <FeedbackTypeBadge type={f.type} />
                  <span className="text-xs text-slate-400">
                    {new Date(f.createdAt).toLocaleDateString("pt-BR")}
                  </span>
                </div>
                <p className="mb-1 text-xs text-slate-400">
                  {tab === "received" ? `De ${f.fromUser.name}` : `Para ${f.toUser.name}`}
                </p>
                <p className="text-sm text-slate-700">{f.message}</p>
                {f.actionItems && (
                  <p className="mt-2 rounded-md bg-slate-50 p-2 text-xs text-slate-600">
                    <span className="font-medium">Próximos passos: </span>
                    {f.actionItems}
                  </p>
                )}
              </Card>
            ))}
          </ul>
        )}
      </div>

      <Card className="h-fit">
        <h2 className="mb-3 font-semibold">Enviar feedback</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Para</label>
            <select
              required
              value={toUserId}
              onChange={(e) => setToUserId(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">Selecione uma pessoa</option>
              {availableRecipients.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} {r.title ? `— ${r.title}` : ""}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Tipo</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as FeedbackType)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              {typeOptions
                .filter((o) => o.value !== "CHECKIN" || canCheckin)
                .map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Mensagem</label>
            <textarea
              required
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              placeholder="Escreva um feedback claro e específico..."
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Próximos passos (opcional)
            </label>
            <textarea
              rows={2}
              value={actionItems}
              onChange={(e) => setActionItems(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          {formError && <p className="text-sm text-red-600">{formError}</p>}
          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? "Enviando..." : "Enviar feedback"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
