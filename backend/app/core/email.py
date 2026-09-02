# backend/app/core/email.py
import os
import smtplib
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional

logger = logging.getLogger("nom035_email")

SMTP_HOST = os.getenv("SMTP_HOST")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
SMTP_TLS = os.getenv("SMTP_TLS", "true").lower() in ("true", "1", "yes")
SMTP_SSL = os.getenv("SMTP_SSL", "false").lower() in ("true", "1", "yes")
EMAILS_FROM_EMAIL = os.getenv("EMAILS_FROM_EMAIL", SMTP_USER or "no-reply@nom035.com")
EMAILS_FROM_NAME = os.getenv("EMAILS_FROM_NAME", "Sistema NOM-035")


def get_password_reset_html(user_name: str, temporary_password: str) -> str:
    return f"""<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Recuperación de Contraseña - NOM-035</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; padding: 30px 15px;">
        <tr>
            <td align="center">
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 540px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -2px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #4f46e5 0%, #3730a3 100%); padding: 32px 24px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">Sistema NOM-035</h1>
                            <p style="margin: 6px 0 0 0; color: #c7d2fe; font-size: 14px;">Gestión y Cumplimiento Normativo</p>
                        </td>
                    </tr>
                    <!-- Content -->
                    <tr>
                        <td style="padding: 36px 28px;">
                            <h2 style="margin: 0 0 16px 0; color: #0f172a; font-size: 18px; font-weight: 700;">Restablecimiento de Contraseña</h2>
                            <p style="margin: 0 0 16px 0; color: #475569; font-size: 15px; line-height: 1.6;">
                                Hola <strong>{user_name}</strong>, hemos recibido una solicitud para recuperar el acceso a tu cuenta en el Sistema de Gestión NOM-035.
                            </p>
                            <p style="margin: 0 0 20px 0; color: #475569; font-size: 15px; line-height: 1.6;">
                                Hemos generado una nueva contraseña temporal para que puedas acceder a la plataforma:
                            </p>
                            
                            <!-- Password Box -->
                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px;">
                                <tr>
                                    <td style="background-color: #f1f5f9; border: 1px dashed #cbd5e1; border-radius: 8px; padding: 18px; text-align: center;">
                                        <span style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #64748b; font-weight: 600; display: block; margin-bottom: 6px;">Tu Contraseña Temporal</span>
                                        <code style="font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace; font-size: 20px; font-weight: 700; color: #4338ca; letter-spacing: 2px;">{temporary_password}</code>
                                    </td>
                                </tr>
                            </table>

                            <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 14px 16px; border-radius: 4px; margin-bottom: 24px;">
                                <p style="margin: 0; color: #1e40af; font-size: 13px; line-height: 1.5;">
                                    <strong>Importante:</strong> Por motivos de seguridad, te recomendamos ingresar con esta contraseña temporal y actualizarla inmediatamente desde la sección de <strong>Ajustes / Perfil</strong>.
                                </p>
                            </div>

                            <p style="margin: 0; color: #64748b; font-size: 13px; line-height: 1.5;">
                                Si no solicitaste este cambio, ponte en contacto con el administrador de tu organización inmediatamente.
                            </p>
                        </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f8fafc; padding: 20px 24px; text-align: center; border-top: 1px solid #e2e8f0;">
                            <p style="margin: 0; color: #94a3b8; font-size: 12px;">
                                Este es un correo automático generado por el Sistema NOM-035. Por favor no respondas a este mensaje.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
"""


def send_password_reset_email(to_email: str, user_name: str, temporary_password: str) -> bool:
    """
    Sends password reset email containing a temporary password.
    Falls back to logging the reset details if SMTP is not configured.
    """
    if not SMTP_HOST:
        logger.info(
            f"[EMAIL SERVICE - MODO DESARROLLO/SIN SMTP]\n"
            f"Para: {to_email} ({user_name})\n"
            f"Asunto: Recuperación de Contraseña - NOM-035\n"
            f"Contraseña temporal generada: {temporary_password}\n"
        )
        print(
            f"[EMAIL SERVICE] Contraseña temporal para {to_email} ({user_name}): {temporary_password}"
        )
        return True

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = "Recuperación de Contraseña - Sistema NOM-035"
        msg["From"] = f"{EMAILS_FROM_NAME} <{EMAILS_FROM_EMAIL}>"
        msg["To"] = to_email

        plain_text = (
            f"Hola {user_name},\n\n"
            f"Hemos recibido una solicitud para recuperar tu contraseña en el Sistema NOM-035.\n"
            f"Tu nueva contraseña temporal es:\n\n"
            f"{temporary_password}\n\n"
            f"Por favor ingresa y actualízala desde la sección de Ajustes / Perfil.\n\n"
            f"Si no solicitaste este cambio, contacta a soporte o al administrador."
        )

        html_content = get_password_reset_html(user_name, temporary_password)

        msg.attach(MIMEText(plain_text, "plain", "utf-8"))
        msg.attach(MIMEText(html_content, "html", "utf-8"))

        if SMTP_SSL:
            with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, timeout=10) as server:
                if SMTP_USER and SMTP_PASSWORD:
                    server.login(SMTP_USER, SMTP_PASSWORD)
                server.sendmail(EMAILS_FROM_EMAIL, [to_email], msg.as_string())
        else:
            with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10) as server:
                if SMTP_TLS:
                    server.starttls()
                if SMTP_USER and SMTP_PASSWORD:
                    server.login(SMTP_USER, SMTP_PASSWORD)
                server.sendmail(EMAILS_FROM_EMAIL, [to_email], msg.as_string())

        logger.info(f"Correo de recuperación enviado con éxito a {to_email}")
        return True
    except Exception as e:
        logger.error(f"Error al enviar correo de recuperación a {to_email}: {e}")
        print(f"[EMAIL ERROR] No se pudo enviar correo a {to_email}: {e}")
        return False
