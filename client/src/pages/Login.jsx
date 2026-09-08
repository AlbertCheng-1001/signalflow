import { Link } from "react-router-dom";
import { AuthForm } from "../components/AuthForm";
import { useAuth } from "../lib/AuthContext";

export function Login() {
  const { login } = useAuth();

  return (
    <AuthForm
      title="Log in"
      submitLabel="Log in"
      onSubmit={login}
      footer={
        <p className="page-note">
          No account yet? <Link to="/signup">Sign up</Link>
        </p>
      }
    />
  );
}
