"""LightRAG FastAPI microservice for MineEcho."""

from __future__ import annotations

import logging
import shutil
from contextlib import asynccontextmanager
from typing import Any

import aiofiles
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from config import settings
from rag_engine import rag_engine

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=getattr(logging, settings.log_level.upper(), logging.INFO),
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Pydantic models
# ---------------------------------------------------------------------------


class InsertRequest(BaseModel):
    content: str = Field(..., min_length=1, description="Text content to insert")
    doc_id: str | None = Field(None, description="Optional document identifier")


class QueryRequest(BaseModel):
    query: str = Field(..., min_length=1, description="Query text")
    mode: str = Field("hybrid", description="Query mode: naive, local, global, hybrid, mix")
    top_k: int = Field(5, ge=1, le=50, description="Number of top results to consider")


class DeleteRequest(BaseModel):
    doc_id: str = Field(..., min_length=1, description="Document identifier to delete")


# ---------------------------------------------------------------------------
# Lifespan
# ---------------------------------------------------------------------------


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize RAG engine on startup."""
    logger.info("Starting LightRAG service on %s:%d", settings.light_rag_host, settings.light_rag_port)
    await rag_engine.initialize()
    yield
    logger.info("Shutting down LightRAG service")


app = FastAPI(
    title="MineEcho LightRAG Service",
    description="Python microservice wrapping LightRAG for hybrid knowledge retrieval",
    version="3.5.0",
    lifespan=lifespan,
)


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@app.get("/health", summary="Health check")
async def health() -> dict[str, Any]:
    """Return service health status."""
    healthy = rag_engine._initialized and rag_engine.rag is not None
    return {
        "status": "healthy" if healthy else "initializing",
        "initialized": healthy,
    }


@app.post("/insert", summary="Insert text into LightRAG")
async def insert_text(req: InsertRequest) -> dict[str, Any]:
    """Insert plain text content into the knowledge base."""
    try:
        result = await rag_engine.insert(req.content, doc_id=req.doc_id)
        return result
    except RuntimeError as exc:
        logger.error("Insert error: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Unexpected insert error")
        raise HTTPException(status_code=500, detail=f"Unexpected error: {exc}") from exc


@app.post("/query", summary="Query LightRAG")
async def query_rag(req: QueryRequest) -> dict[str, Any]:
    """Query the knowledge base with hybrid or mode-specific retrieval."""
    try:
        result = await rag_engine.query(req.query, mode=req.mode, top_k=req.top_k)
        return result
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except RuntimeError as exc:
        logger.error("Query error: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Unexpected query error")
        raise HTTPException(status_code=500, detail=f"Unexpected error: {exc}") from exc


@app.get("/graph", summary="Get knowledge graph")
async def get_graph() -> dict[str, Any]:
    """Export knowledge graph nodes and edges for visualization."""
    try:
        return await rag_engine.get_graph()
    except RuntimeError as exc:
        logger.error("Graph export error: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Unexpected graph export error")
        raise HTTPException(status_code=500, detail=f"Unexpected error: {exc}") from exc


@app.post("/insert-file", summary="Upload and insert a file")
async def insert_file(
    file: UploadFile = File(..., description="File to upload (.txt, .md, .pdf)"),
    doc_id: str | None = Form(None, description="Optional document identifier"),
) -> dict[str, Any]:
    """Upload a file, extract text, and insert into LightRAG."""
    allowed_extensions = {".txt", ".md", ".pdf"}
    filename = file.filename or "unknown"
    ext = filename[filename.rfind(".") :].lower() if "." in filename else ""

    if ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{ext}'. Allowed: {allowed_extensions}",
        )

    try:
        # Save to temp location
        temp_path = f"/tmp/lightrag_upload_{filename}"
        async with aiofiles.open(temp_path, "wb") as out:
            content = await file.read()
            await out.write(content)

        # Extract text
        text = ""
        if ext in {".txt", ".md"}:
            async with aiofiles.open(temp_path, "r", encoding="utf-8") as f:
                text = await f.read()
        elif ext == ".pdf":
            text = await _extract_pdf_text(temp_path)

        if not text or not text.strip():
            raise HTTPException(status_code=400, detail="File contains no extractable text")

        # Insert
        result = await rag_engine.insert(text.strip(), doc_id=doc_id or filename)
        result["filename"] = filename
        return result

    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("File insert error")
        raise HTTPException(status_code=500, detail=f"File processing failed: {exc}") from exc
    finally:
        # Cleanup temp file
        try:
            shutil.rmtree(temp_path, ignore_errors=True)
        except Exception:
            pass


async def _extract_pdf_text(path: str) -> str:
    """Extract text from a PDF file using PyPDF2."""
    try:
        import PyPDF2
    except ImportError as exc:
        raise RuntimeError("PyPDF2 is not installed") from exc

    loop = __import__("asyncio").get_event_loop()

    def _read() -> str:
        text_parts: list[str] = []
        with open(path, "rb") as f:
            reader = PyPDF2.PdfReader(f)
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text_parts.append(page_text)
        return "\n".join(text_parts)

    return await loop.run_in_executor(None, _read)


@app.post("/delete", summary="Delete a document")
async def delete_doc(req: DeleteRequest) -> dict[str, Any]:
    """Request deletion of a document from LightRAG."""
    try:
        result = await rag_engine.delete(req.doc_id)
        return result
    except RuntimeError as exc:
        logger.error("Delete error: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Unexpected delete error")
        raise HTTPException(status_code=500, detail=f"Unexpected error: {exc}") from exc


# ---------------------------------------------------------------------------
# Run
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host=settings.light_rag_host,
        port=settings.light_rag_port,
        log_level=settings.log_level.lower(),
    )
