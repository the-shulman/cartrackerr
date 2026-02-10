import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Car, Mail, Lock, Loader2, Phone } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Login = () => {
  const navigate = useNavigate();
  const { signIn } = useAuthContext();
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [loginMethod, setLoginMethod] = useState<"email" | "phone">("email");

  const validatePhone = (value: string) => {
    const digitsOnly = value.replace(/\D/g, "");
    return digitsOnly.slice(0, 10);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(validatePhone(e.target.value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    let loginEmail = email;

    // If logging in with phone, first get the email associated with the phone
    if (loginMethod === "phone") {
      if (phone.length !== 10) {
        toast.error("El número de celular debe tener 10 dígitos");
        setLoading(false);
        return;
      }

      // Use secure edge function for phone login - email never exposed to client
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/phone-login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ phone, password }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.session) {
        toast.error(result.error || "Credenciales inválidas");
        setLoading(false);
        return;
      }

      // Set the session returned by the edge function
      await supabase.auth.setSession({
        access_token: result.session.access_token,
        refresh_token: result.session.refresh_token,
      });

      toast.success("¡Bienvenido de vuelta!");
      navigate("/");
      setLoading(false);
      return;
    }

    const { error } = await signIn(loginEmail, password);

    if (error) {
      toast.error("Error al iniciar sesión: " + error.message);
      setLoading(false);
      return;
    }

    toast.success("¡Bienvenido de vuelta!");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 safe-area-inset">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 md:w-12 md:h-12 bg-primary rounded-xl flex items-center justify-center">
              <Car className="w-8 h-8 md:w-6 md:h-6 text-primary-foreground" />
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl md:text-2xl">Iniciar Sesión</CardTitle>
            <CardDescription className="mt-1">
              Accede al panel de tu taller
            </CardDescription>
          </div>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <Tabs value={loginMethod} onValueChange={(v) => setLoginMethod(v as "email" | "phone")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email
                </TabsTrigger>
                <TabsTrigger value="phone" className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Teléfono
                </TabsTrigger>
              </TabsList>
              <TabsContent value="email" className="space-y-2 mt-4">
                <Label htmlFor="email">Correo Electrónico</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9 h-12 text-base"
                    required={loginMethod === "email"}
                    autoComplete="email"
                    inputMode="email"
                  />
                </div>
              </TabsContent>
              <TabsContent value="phone" className="space-y-2 mt-4">
                <Label htmlFor="phone">Número de Celular</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="5512345678"
                    value={phone}
                    onChange={handlePhoneChange}
                    className="pl-9 h-12 text-base"
                    required={loginMethod === "phone"}
                    maxLength={10}
                    inputMode="numeric"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  10 dígitos sin espacios ni guiones
                </p>
              </TabsContent>
            </Tabs>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 h-12 text-base"
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button 
              type="submit" 
              className="w-full h-12 text-base touch-manipulation active:scale-[0.98]" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Iniciando sesión...
                </>
              ) : (
                "Iniciar Sesión"
              )}
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              ¿No tienes cuenta?{" "}
              <Link to="/registro" className="text-primary hover:underline font-medium">
                Registra tu taller
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default Login;
