def intcomma(value):
    if value is None:
        return ""
    return f"{value:,.0f}".replace(",", ".")