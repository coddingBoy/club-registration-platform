import { type FormEvent, useState } from "react";
import type { AdminSession } from "../types";
import { loginAdmin } from "../utils/api";
import FormField from "./FormField";

type AdminLoginProps = {
  onLogin: (session: AdminSession) => void;
};

function AdminLogin({ onLogin }: AdminLoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    try {
      const session = await loginAdmin({ email, password });
      onLogin(session);
      setEmail("");
      setPassword("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Admin login failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="form-card">
      <div className="intro-panel">
        <p>Sign in to access the academy administration dashboard.</p>
      </div>

      <form className="registration-form" onSubmit={handleSubmit} noValidate>
        {message && <p className="field-error panel-error">{message}</p>}

        <fieldset className="form-section">
          <legend>Admin Login</legend>
          <div className="section-grid">
            <FormField label="Email Address" htmlFor="adminEmail" required>
              <input
                id="adminEmail"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </FormField>
            <FormField label="Password" htmlFor="adminPassword" required>
              <input
                id="adminPassword"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </FormField>
          </div>
        </fieldset>

        <button className="submit-button" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Signing In..." : "Sign In"}
        </button>
      </form>
    </section>
  );
}

export default AdminLogin;
