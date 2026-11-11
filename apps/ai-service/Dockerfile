# ============================================================
# TROSV ai-service - Python 3.12, Debian 13 "trixie" (khop convention
# Debian cua cac image khac trong stack).
# ============================================================
FROM python:3.12-slim-trixie

ARG INSTALL_DEV="false"

# Chay bang user thuong (khong root). /app thuoc ve user nay de pytest ghi duoc
# .pytest_cache (pyproject dat filterwarnings=error).
RUN useradd --system --uid 10001 --no-create-home --shell /usr/sbin/nologin app \
    && mkdir -p /app && chown app:app /app

WORKDIR /app

COPY requirements.txt requirements-dev.txt* ./
RUN pip install --no-cache-dir -r requirements.txt \
    && if [ "$INSTALL_DEV" = "true" ] && [ -f requirements-dev.txt ]; then \
        pip install --no-cache-dir -r requirements-dev.txt; \
    fi

COPY --chown=app:app . .

USER 10001

EXPOSE 8001

# Image python slim khong co curl - dung urllib (non-2xx/raise => exit 1).
HEALTHCHECK --interval=15s --timeout=3s --start-period=15s --retries=5 \
    CMD ["python3", "-c", "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8001/health', timeout=3)"]

# Khoi lenh that do compose gan (uvicorn ...); CMD giu cho chay doc lap.
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001"]

