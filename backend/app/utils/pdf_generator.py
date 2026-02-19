from jinja2 import Environment, FileSystemLoader
from weasyprint import CSS, HTML
import os
from app.utils.filters import intcomma

BASE_DIR = os.path.dirname(os.path.dirname(__file__))

def render_pdf_from_template(template_name: str, context: dict, page_size: str, output_path: str | None = None) -> bytes:
    """
    Renderiza un template HTML con Jinja2 y lo convierte a PDF usando WeasyPrint.
    Devuelve los bytes del PDF o lo guarda si se pasa un output_path.
    """
    # Cargar plantilla
    env = Environment(loader=FileSystemLoader(os.path.join(BASE_DIR, "templates")))
    env.filters["intcomma"] = intcomma
    template = env.get_template(template_name)

    # Renderizar HTML con los datos del contexto
    html_content = template.render(**context)

    css = CSS(string=f"@page {{ size: {page_size}; margin: 10mm 18mm 20mm 18mm; }}")

    # Crear PDF con WeasyPrint
    pdf = HTML(string=html_content).write_pdf(stylesheets=[css])

    # Guardar si se indica un archivo destino
    if output_path:
        with open(output_path, "wb") as f:
            f.write(pdf)

    return pdf
