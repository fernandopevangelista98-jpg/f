"""
Serviço de Geração de Certificados PDF
"""
from io import BytesIO
from datetime import datetime
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.colors import HexColor
from reportlab.lib.units import cm
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader


def gerar_certificado(
    nome_aluno: str,
    titulo_prova: str,
    titulo_temporada: str,
    pontuacao: float,
    data_realizacao: datetime
) -> bytes:
    """
    Gera um certificado PDF de conclusão.
    
    Args:
        nome_aluno: Nome completo do aluno
        titulo_prova: Título da prova realizada
        titulo_temporada: Título da temporada
        pontuacao: Nota obtida (0-100)
        data_realizacao: Data que realizou a prova
    
    Returns:
        bytes do PDF gerado
    """
    buffer = BytesIO()
    
    # Criar canvas em paisagem
    width, height = landscape(A4)
    c = canvas.Canvas(buffer, pagesize=landscape(A4))
    
    # Cores
    cor_primaria = HexColor('#E91E63')  # Rosa AEC
    cor_secundaria = HexColor('#9C27B0')  # Roxo
    cor_texto = HexColor('#1E293B')  # Slate escuro
    cor_texto_claro = HexColor('#64748B')  # Slate médio
    
    # === FUNDO E BORDAS ===
    # Borda decorativa
    c.setStrokeColor(cor_primaria)
    c.setLineWidth(3)
    c.rect(1.5*cm, 1.5*cm, width - 3*cm, height - 3*cm)
    
    # Borda interna decorativa
    c.setStrokeColor(cor_secundaria)
    c.setLineWidth(1)
    c.rect(2*cm, 2*cm, width - 4*cm, height - 4*cm)
    
    # === CABEÇALHO ===
    # Logo/título
    c.setFont("Helvetica-Bold", 14)
    c.setFillColor(cor_primaria)
    c.drawCentredString(width/2, height - 3*cm, "NEXT LEVEL PODCAST")
    
    c.setFont("Helvetica", 10)
    c.setFillColor(cor_texto_claro)
    c.drawCentredString(width/2, height - 3.6*cm, "Plataforma de Educação Corporativa")
    
    # === TÍTULO CERTIFICADO ===
    c.setFont("Helvetica-Bold", 36)
    c.setFillColor(cor_texto)
    c.drawCentredString(width/2, height - 6*cm, "CERTIFICADO")
    
    # Linha decorativa
    c.setStrokeColor(cor_primaria)
    c.setLineWidth(2)
    c.line(width/2 - 4*cm, height - 6.5*cm, width/2 + 4*cm, height - 6.5*cm)
    
    # === TEXTO PRINCIPAL ===
    c.setFont("Helvetica", 14)
    c.setFillColor(cor_texto)
    c.drawCentredString(width/2, height - 8*cm, "Certificamos que")
    
    # Nome do aluno
    c.setFont("Helvetica-Bold", 28)
    c.setFillColor(cor_primaria)
    c.drawCentredString(width/2, height - 9.5*cm, nome_aluno.upper())
    
    # Linha sob o nome
    c.setStrokeColor(cor_secundaria)
    c.setLineWidth(1)
    c.line(width/2 - 7*cm, height - 10*cm, width/2 + 7*cm, height - 10*cm)
    
    # Texto de conclusão
    c.setFont("Helvetica", 14)
    c.setFillColor(cor_texto)
    c.drawCentredString(width/2, height - 11.5*cm, "concluiu com sucesso a avaliação")
    
    # Título da prova
    c.setFont("Helvetica-Bold", 18)
    c.setFillColor(cor_texto)
    c.drawCentredString(width/2, height - 12.8*cm, f'"{titulo_prova}"')
    
    # Temporada
    c.setFont("Helvetica", 12)
    c.setFillColor(cor_texto_claro)
    c.drawCentredString(width/2, height - 13.8*cm, f"Temporada: {titulo_temporada}")
    
    # Nota
    c.setFont("Helvetica-Bold", 16)
    c.setFillColor(cor_secundaria)
    c.drawCentredString(width/2, height - 15.2*cm, f"Nota obtida: {pontuacao:.1f}%")
    
    # === RODAPÉ ===
    # Data
    data_formatada = data_realizacao.strftime("%d de %B de %Y")
    # Traduzir meses para português
    meses = {
        'January': 'janeiro', 'February': 'fevereiro', 'March': 'março',
        'April': 'abril', 'May': 'maio', 'June': 'junho',
        'July': 'julho', 'August': 'agosto', 'September': 'setembro',
        'October': 'outubro', 'November': 'novembro', 'December': 'dezembro'
    }
    for en, pt in meses.items():
        data_formatada = data_formatada.replace(en, pt)
    
    c.setFont("Helvetica", 11)
    c.setFillColor(cor_texto_claro)
    c.drawCentredString(width/2, 3.5*cm, f"Emitido em {data_formatada}")
    
    # ID do certificado (pode ser usado para validação)
    c.setFont("Helvetica", 8)
    c.setFillColor(cor_texto_claro)
    c.drawCentredString(width/2, 2.5*cm, f"Código de validação: NLP-{data_realizacao.strftime('%Y%m%d%H%M%S')}")
    
    # Finalizar PDF
    c.showPage()
    c.save()
    
    buffer.seek(0)
    return buffer.getvalue()
