"""
Serviço de Email usando Resend
"""
import resend
import os
from typing import Optional

# Configurar API Key
resend.api_key = os.getenv("RESEND_API_KEY", "")
EMAIL_FROM = os.getenv("EMAIL_FROM", "onboarding@resend.dev")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

async def send_email(to: str, subject: str, html: str) -> bool:
    """Envia um email usando Resend"""
    try:
        params = {
            "from": EMAIL_FROM,
            "to": [to],
            "subject": subject,
            "html": html
        }
        resend.Emails.send(params)
        return True
    except Exception as e:
        print(f"Erro ao enviar email: {e}")
        return False

async def send_welcome_email(nome: str, email: str) -> bool:
    """Email de boas-vindas após cadastro"""
    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 40px; text-align: center;">
            <h1 style="color: #ec4899; margin: 0;">🎧 Podcast Next Level</h1>
            <p style="color: #94a3b8;">Original AeC</p>
        </div>
        
        <div style="padding: 30px; background: #f8fafc;">
            <h2 style="color: #0f172a;">Olá, {nome}! 👋</h2>
            
            <p style="color: #475569; line-height: 1.6;">
                Seu cadastro foi recebido com sucesso! 
            </p>
            
            <p style="color: #475569; line-height: 1.6;">
                Agora sua conta está <strong>aguardando aprovação</strong> de um administrador.
                Você receberá um email assim que sua conta for ativada.
            </p>
            
            <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
                <p style="color: #92400e; margin: 0;">
                    ⏳ <strong>Status:</strong> Pendente de aprovação
                </p>
            </div>
            
            <p style="color: #94a3b8; font-size: 12px; margin-top: 40px;">
                Este é um email automático. Por favor, não responda.
            </p>
        </div>
    </div>
    """
    return await send_email(email, "Cadastro Recebido - Podcast Next Level", html)

async def send_approval_email(nome: str, email: str) -> bool:
    """Email de aprovação de conta"""
    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 40px; text-align: center;">
            <h1 style="color: #ec4899; margin: 0;">🎧 Podcast Next Level</h1>
            <p style="color: #94a3b8;">Original AeC</p>
        </div>
        
        <div style="padding: 30px; background: #f8fafc;">
            <h2 style="color: #0f172a;">Parabéns, {nome}! 🎉</h2>
            
            <p style="color: #475569; line-height: 1.6;">
                Sua conta foi <strong style="color: #22c55e;">APROVADA</strong>!
            </p>
            
            <p style="color: #475569; line-height: 1.6;">
                Você já pode acessar a plataforma e começar sua jornada de aprendizado.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="{FRONTEND_URL}" 
                   style="background: #ec4899; color: white; padding: 15px 30px; 
                          text-decoration: none; border-radius: 50px; font-weight: bold;">
                    🚀 Acessar Plataforma
                </a>
            </div>
            
            <div style="background: #dcfce7; border-left: 4px solid #22c55e; padding: 15px; margin: 20px 0;">
                <p style="color: #166534; margin: 0;">
                    ✅ <strong>Status:</strong> Conta Ativa
                </p>
            </div>
        </div>
    </div>
    """
    return await send_email(email, "Conta Aprovada - Podcast Next Level 🎉", html)

async def send_rejection_email(nome: str, email: str, motivo: Optional[str] = None) -> bool:
    """Email de rejeição de conta"""
    motivo_texto = motivo or "Não informado"
    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 40px; text-align: center;">
            <h1 style="color: #ec4899; margin: 0;">🎧 Podcast Next Level</h1>
            <p style="color: #94a3b8;">Original AeC</p>
        </div>
        
        <div style="padding: 30px; background: #f8fafc;">
            <h2 style="color: #0f172a;">Olá, {nome}</h2>
            
            <p style="color: #475569; line-height: 1.6;">
                Infelizmente, seu cadastro <strong style="color: #ef4444;">não foi aprovado</strong>.
            </p>
            
            <div style="background: #fee2e2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0;">
                <p style="color: #991b1b; margin: 0;">
                    <strong>Motivo:</strong> {motivo_texto}
                </p>
            </div>
            
            <p style="color: #475569; line-height: 1.6;">
                Se você acredita que houve um erro, entre em contato com o administrador.
            </p>
        </div>
    </div>
    """
    return await send_email(email, "Cadastro Não Aprovado - Podcast Next Level", html)

async def send_password_reset_email(nome: str, email: str, token: str) -> bool:
    """Email de recuperação de senha"""
    reset_link = f"{FRONTEND_URL}/reset-password?token={token}"
    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 40px; text-align: center;">
            <h1 style="color: #ec4899; margin: 0;">🎧 Podcast Next Level</h1>
            <p style="color: #94a3b8;">Recuperação de Senha</p>
        </div>
        
        <div style="padding: 30px; background: #f8fafc;">
            <h2 style="color: #0f172a;">Olá, {nome}</h2>
            
            <p style="color: #475569; line-height: 1.6;">
                Recebemos uma solicitação para redefinir sua senha.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="{reset_link}" 
                   style="background: #ec4899; color: white; padding: 15px 30px; 
                          text-decoration: none; border-radius: 50px; font-weight: bold;">
                    🔐 Redefinir Senha
                </a>
            </div>
            
            <p style="color: #94a3b8; font-size: 12px;">
                Este link expira em 1 hora. Se você não solicitou esta alteração, ignore este email.
            </p>
        </div>
    </div>
    """
    return await send_email(email, "Recuperação de Senha - Podcast Next Level", html)

async def send_certificate_email(nome: str, email: str, temporada: str, nota: float, certificado_url: str) -> bool:
    """Email com certificado de conclusão"""
    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 40px; text-align: center;">
            <h1 style="color: #ec4899; margin: 0;">🏆 Parabéns!</h1>
            <p style="color: #94a3b8;">Você concluiu a certificação</p>
        </div>
        
        <div style="padding: 30px; background: #f8fafc; text-align: center;">
            <h2 style="color: #0f172a;">{nome}</h2>
            
            <p style="color: #475569; line-height: 1.6;">
                Você foi <strong style="color: #22c55e;">APROVADO(A)</strong> na certificação da 
                <strong>{temporada}</strong>!
            </p>
            
            <div style="background: #dcfce7; padding: 20px; border-radius: 10px; margin: 20px 0;">
                <p style="color: #166534; font-size: 32px; font-weight: bold; margin: 0;">
                    {nota:.1f}%
                </p>
                <p style="color: #166534; margin: 5px 0 0 0;">Nota Final</p>
            </div>
            
            <div style="margin: 30px 0;">
                <a href="{certificado_url}" 
                   style="background: #ec4899; color: white; padding: 15px 30px; 
                          text-decoration: none; border-radius: 50px; font-weight: bold;">
                    📜 Baixar Certificado
                </a>
            </div>
        </div>
    </div>
    """
    return await send_email(email, f"Certificado de Conclusão - {temporada} 🏆", html)
