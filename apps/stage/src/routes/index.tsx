import { useEffect } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router";
import { Spinner } from "~/components/common/Spinner";
import { AuthProvider, useAuth } from "~/lib/auth";
import { ThemeEngine } from "~/theme/ThemeEngine";
import { CharacterSelect } from "./CharacterSelect";
import { Play } from "./Play";
import { Settings } from "./Settings";
import { SignIn } from "./SignIn";
import { Worlds } from "./Worlds";

const SIGN_IN_PATH = "/sign-in";

function AuthGate() {
  const { user, ready } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!ready) return;
    const onSignIn = location.pathname === SIGN_IN_PATH;
    if (user === null && !onSignIn) void navigate(SIGN_IN_PATH, { replace: true });
    if (user !== null && onSignIn) void navigate("/", { replace: true });
  }, [location.pathname, navigate, ready, user]);

  if (!ready) {
    return (
      <div className="flex h-full items-center justify-center bg-canvas text-primary">
        <Spinner size={24} label="Restoring your session" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path={SIGN_IN_PATH} element={<SignIn />} />
      <Route path="/" element={<Worlds />} />
      <Route path="/character-select" element={<CharacterSelect />} />
      <Route path="/play/:id" element={<Play />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export function AppRoutes() {
  return (
    <AuthProvider>
      <ThemeEngine>
        <AuthGate />
      </ThemeEngine>
    </AuthProvider>
  );
}
