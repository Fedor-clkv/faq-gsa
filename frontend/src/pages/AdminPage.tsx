import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, LogOut, Save, Loader2, ArrowLeft, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import axios from "axios";

const ADMIN_USER = "admin";
const ADMIN_PASS = "1324Derparol!";
const TOKEN_KEY = "gsa_admin_token";

function AdminLogin({ onLogin }: { onLogin: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === ADMIN_USER && password === ADMIN_PASS) {
      sessionStorage.setItem(TOKEN_KEY, btoa(`${username}:${password}`));
      onLogin();
    } else {
      setError("Неверный логин или пароль");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-xl font-bold">Панель администратора</h1>
          <p className="text-sm text-muted-foreground">GSA Wizard — настройки системы</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Логин</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
              autoComplete="username"
              className="bg-background"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Пароль</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                className="bg-background pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <Button type="submit" className="w-full">
            Войти
          </Button>
        </form>
      </div>
    </div>
  );
}

interface AdminSettings {
  openai_api_key: string;
  openai_model: string;
  redis_url: string;
  session_ttl_seconds: number;
  cors_origins: string;
}

function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<AdminSettings>({
    openai_api_key: "",
    openai_model: "gpt-4o",
    redis_url: "redis://localhost:6379/0",
    session_ttl_seconds: 86400,
    cors_origins: "http://localhost:5173",
  });
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const token = sessionStorage.getItem(TOKEN_KEY) ?? "";
  const authHeaders = { Authorization: `Basic ${token}` };

  useEffect(() => {
    axios
      .get("/api/admin/settings", { headers: authHeaders })
      .then((r) => setSettings(r.data))
      .catch(() => setError("Не удалось загрузить настройки"))
      .finally(() => setFetchLoading(false));
  }, []);

  const handleSave = async () => {
    setLoading(true);
    setError("");
    try {
      await axios.post("/api/admin/settings", settings, { headers: authHeaders });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError("Ошибка сохранения настроек");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="h-14 border-b border-border bg-card/50 flex items-center px-6 gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          <span className="font-semibold text-sm">Панель администратора</span>
        </div>
        <Badge variant="secondary" className="ml-auto text-xs">admin</Badge>
        <Button variant="ghost" size="sm" onClick={onLogout} className="gap-1.5 text-muted-foreground">
          <LogOut className="w-4 h-4" />
          Выйти
        </Button>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8 space-y-8">
        <div>
          <h2 className="text-xl font-bold">Системные настройки</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Изменения применяются немедленно — перезапуск бэкенда не требуется.
          </p>
        </div>

        {fetchLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            Загрузка настроек...
          </div>
        ) : (
          <>
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                OpenAI
              </h3>
              <div className="space-y-4 p-4 rounded-lg border border-border bg-card/50">
                <div className="space-y-2">
                  <Label>API Ключ</Label>
                  <Input
                    type="password"
                    value={settings.openai_api_key}
                    onChange={(e) => setSettings({ ...settings, openai_api_key: e.target.value })}
                    placeholder="sk-..."
                    className="bg-background font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Ключ OpenAI API. Получить на{" "}
                    <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      platform.openai.com
                    </a>
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Модель</Label>
                  <div className="flex flex-wrap gap-2">
                    {["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"].map((m) => (
                      <button
                        key={m}
                        onClick={() => setSettings({ ...settings, openai_model: m })}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                          settings.openai_model === m
                            ? "bg-primary/10 border-primary/50 text-primary"
                            : "border-border text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Redis
              </h3>
              <div className="space-y-4 p-4 rounded-lg border border-border bg-card/50">
                <div className="space-y-2">
                  <Label>URL подключения</Label>
                  <Input
                    value={settings.redis_url}
                    onChange={(e) => setSettings({ ...settings, redis_url: e.target.value })}
                    placeholder="redis://localhost:6379/0"
                    className="bg-background font-mono text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label>TTL сессии (секунды)</Label>
                  <Input
                    type="number"
                    value={settings.session_ttl_seconds}
                    onChange={(e) => setSettings({ ...settings, session_ttl_seconds: Number(e.target.value) })}
                    min={3600}
                    max={604800}
                    className="bg-background"
                  />
                  <p className="text-xs text-muted-foreground">
                    86400 = 24 часа, 604800 = 7 дней
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                CORS
              </h3>
              <div className="p-4 rounded-lg border border-border bg-card/50">
                <div className="space-y-2">
                  <Label>Разрешённые origins (через запятую)</Label>
                  <Input
                    value={settings.cors_origins}
                    onChange={(e) => setSettings({ ...settings, cors_origins: e.target.value })}
                    placeholder="http://localhost:5173,https://yourdomain.com"
                    className="bg-background font-mono text-sm"
                  />
                </div>
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex items-center gap-3">
              <Button onClick={handleSave} disabled={loading} className="gap-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Сохранить настройки
              </Button>
              {saved && (
                <Badge variant="success" className="text-xs">
                  ✓ Сохранено
                </Badge>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default function AdminPage() {
  const [authed, setAuthed] = useState(() => !!sessionStorage.getItem(TOKEN_KEY));

  const handleLogout = () => {
    sessionStorage.removeItem(TOKEN_KEY);
    setAuthed(false);
  };

  if (!authed) return <AdminLogin onLogin={() => setAuthed(true)} />;
  return <AdminDashboard onLogout={handleLogout} />;
}
