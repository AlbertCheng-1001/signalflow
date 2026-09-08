import { Link } from "react-router-dom";
import { AuthForm } from "../components/AuthForm";
import { useAuth } from "../lib/AuthContext";

export function Signup() {
  const { signup } = useAuth();

  return (
    <AuthForm
      title="Create account"
      submitLabel="Sign up"
      onSubmit={signup}
      footer={
        <p className="page-note">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      }
    />
  );
}
