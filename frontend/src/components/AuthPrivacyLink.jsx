import React from "react";
import { Link } from "react-router-dom";

export default function AuthPrivacyLink() {
  return (
    <Link
      to="/aviso-de-privacidad"
      target="_blank"
      rel="noopener noreferrer"
      className="auth-privacy-link"
    >
      Aviso de privacidad
    </Link>
  );
}
