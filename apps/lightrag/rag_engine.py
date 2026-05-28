"""LightRAG engine wrapper with initialization, insert, query, and graph export."""

from __future__ import annotations

import asyncio
import logging
import os
from typing import Any, Dict, List, Optional

import aiohttp
import numpy as np
from openai import AsyncOpenAI

from lightrag import LightRAG, QueryParam
from lightrag.utils import EmbeddingFunc, wrap_embedding_func_with_attrs

from config import settings

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# MiniMax Embedding (proprietary format, not standard OpenAI)
# ---------------------------------------------------------------------------

_MINIMAX_EMBED_MODEL = "embo-01"
_MINIMAX_EMBED_DIM = 1536


async def _minimax_embedding(texts: List[str]) -> np.ndarray:
    """Call MiniMax embedding API (proprietary format).

    MiniMax embedding body:  { model, texts: string[], type: "db"|"query" }
    MiniMax embedding resp:  { vectors: number[][], base_resp: { status_code, status_msg } }
    """
    api_key = settings.light_rag_api_key
    if not api_key:
        raise RuntimeError("MiniMax API key not configured")

    url = f"{settings.minimax_embedding_base_url}/embeddings"
    payload = {
        "model": _MINIMAX_EMBED_MODEL,
        "texts": texts,
        "type": "db",
    }
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}",
    }

    async with aiohttp.ClientSession() as session:
        async with session.post(url, json=payload, headers=headers) as resp:
            raw = await resp.json()
            base_resp = raw.get("base_resp", {})
            if base_resp.get("status_code", 0) != 0:
                raise RuntimeError(
                    f"MiniMax embedding error {base_resp.get('status_code')}: "
                    f"{base_resp.get('status_msg')}"
                )
            vectors = raw.get("vectors")
            if not vectors or len(vectors) != len(texts):
                raise RuntimeError(
                    f"MiniMax embedding unexpected shape: {len(vectors) if vectors else 'null'} vectors, "
                    f"expected {len(texts)}"
                )
            return np.array(vectors, dtype=np.float32)


# Wrap the embedding function with required metadata for LightRAG
embedding_func = wrap_embedding_func_with_attrs(
    embedding_dim=_MINIMAX_EMBED_DIM,
    max_token_size=8192,
)(_minimax_embedding)


# ---------------------------------------------------------------------------
# LLM via MiniMax OpenAI-compatible endpoint
# ---------------------------------------------------------------------------

def _get_openai_client() -> AsyncOpenAI:
    """Create an AsyncOpenAI client pointing to MiniMax OpenAI-compatible endpoint."""
    return AsyncOpenAI(
        api_key=settings.light_rag_api_key or "",
        base_url=settings.light_rag_openai_base_url or None,
    )


async def _llm_model_func(
    prompt: str,
    **kwargs: Any,
) -> str:
    """LLM adapter for LightRAG using MiniMax OpenAI-compatible API."""
    client = _get_openai_client()
    messages = []
    system_prompt = kwargs.get("system_prompt")
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    history_messages = kwargs.get("history_messages")
    if history_messages:
        messages.extend(history_messages)
    messages.append({"role": "user", "content": prompt})

    max_tokens = kwargs.get("max_tokens", 4096)

    # Strip <think> blocks from MiniMax reasoning models before returning
    raw_content = ""
    try:
        response = await client.chat.completions.create(
            model=settings.light_rag_llm_model,
            messages=messages,
            max_tokens=max_tokens,
            temperature=0.3,
        )
        raw_content = response.choices[0].message.content or ""
    except Exception as exc:
        logger.warning("LLM call failed: %s", exc)
        raise

    # MiniMax M2.5 may wrap reasoning in <think>...</think>
    if "<think>" in raw_content and "</think>" in raw_content:
        raw_content = raw_content.split("</think>")[-1].strip()
    return raw_content


# ---------------------------------------------------------------------------
# RAGEngine
# ---------------------------------------------------------------------------

class RAGEngine:
    """Production-ready wrapper around LightRAG."""

    def __init__(self) -> None:
        self.rag: Optional[LightRAG] = None
        self._lock = asyncio.Lock()
        self._initialized = False

    async def initialize(self) -> None:
        """Initialize LightRAG with async-safe locking."""
        if self._initialized:
            return

        async with self._lock:
            if self._initialized:
                return

            os.makedirs(settings.light_rag_working_dir, exist_ok=True)

            self.rag = LightRAG(
                working_dir=settings.light_rag_working_dir,
                llm_model_func=_llm_model_func,
                embedding_func=embedding_func,
                llm_model_name=settings.light_rag_llm_model,
            )
            self._initialized = True
            logger.info(
                "LightRAG initialized (working_dir=%s, llm=%s, embed=%s)",
                settings.light_rag_working_dir,
                settings.light_rag_llm_model,
                settings.light_rag_embedding_model,
            )

    async def insert(self, content: str, doc_id: Optional[str] = None) -> Dict[str, Any]:
        """Insert text into LightRAG."""
        await self.initialize()
        if self.rag is None:
            raise RuntimeError("RAG engine not initialized")

        try:
            await self.rag.ainsert(content, ids=doc_id)
            logger.info("Inserted document (doc_id=%s, length=%d)", doc_id, len(content))
            return {"status": "ok", "doc_id": doc_id, "chars_inserted": len(content)}
        except Exception as exc:
            logger.exception("Failed to insert document (doc_id=%s)", doc_id)
            raise RuntimeError(f"Insert failed: {exc}") from exc

    async def query(
        self,
        query_text: str,
        mode: str = "hybrid",
        top_k: int = 5,
    ) -> Dict[str, Any]:
        """Query LightRAG with specified mode."""
        await self.initialize()
        if self.rag is None:
            raise RuntimeError("RAG engine not initialized")

        valid_modes = {"naive", "local", "global", "hybrid", "mix"}
        if mode not in valid_modes:
            raise ValueError(f"Invalid mode '{mode}'. Choose from {valid_modes}")

        try:
            param = QueryParam(mode=mode, top_k=top_k)
            answer = await self.rag.aquery(query_text, param=param)

            logger.info("Query processed (mode=%s, query_length=%d)", mode, len(query_text))
            return {"answer": answer, "sources": [], "mode": mode}
        except Exception as exc:
            logger.exception("Query failed (mode=%s)", mode)
            raise RuntimeError(f"Query failed: {exc}") from exc

    async def delete(self, doc_id: str) -> Dict[str, Any]:
        """Delete a document from LightRAG.

        LightRAG core does not expose a native delete-by-doc_id API.
        This implementation returns a clear message so callers know the limitation.
        """
        await self.initialize()
        if self.rag is None:
            raise RuntimeError("RAG engine not initialized")

        logger.warning(
            "Delete by doc_id is not natively supported by LightRAG (doc_id=%s). "
            "Consider re-initializing with a fresh working_dir to remove all data.",
            doc_id,
        )
        return {
            "status": "not_implemented",
            "message": (
                "LightRAG core does not support delete-by-doc_id. "
                "To remove data, delete the working_dir and restart the service."
            ),
            "doc_id": doc_id,
        }

    async def get_graph(self) -> Dict[str, Any]:
        """Export knowledge graph as nodes + edges for frontend visualization."""
        await self.initialize()
        if self.rag is None:
            raise RuntimeError("RAG engine not initialized")

        try:
            # Access internal NetworkX graph directly for full export
            graph_storage = getattr(self.rag, "chunk_entity_relation_graph", None)
            if graph_storage is None:
                return {"nodes": [], "edges": []}

            nx_graph = getattr(graph_storage, "_graph", None)
            if nx_graph is None:
                return {"nodes": [], "edges": []}

            nodes: List[Dict[str, Any]] = []
            edges: List[Dict[str, Any]] = []
            seen_node_ids = set()

            for node_id, data in nx_graph.nodes(data=True):
                if node_id in seen_node_ids:
                    continue
                seen_node_ids.add(node_id)
                # node_id is the label, entity_type may be in data
                entity_type = data.get("entity_type", "unknown") if isinstance(data, dict) else "unknown"
                description = ""
                if isinstance(data, dict):
                    description = str(data.get("description", ""))[:300]
                nodes.append(
                    {
                        "id": str(node_id),
                        "label": str(node_id),
                        "type": entity_type,
                        "description": description,
                    }
                )

            for source, target, data in nx_graph.edges(data=True):
                relation = "related_to"
                if isinstance(data, dict):
                    relation = data.get("relation_type", data.get("relation", "related_to"))
                edges.append(
                    {
                        "source": str(source),
                        "target": str(target),
                        "relation": relation,
                        "weight": 1.0,
                    }
                )

            logger.info("Graph exported (nodes=%d, edges=%d)", len(nodes), len(edges))
            return {"nodes": nodes, "edges": edges}
        except Exception as exc:
            logger.exception("Graph export failed")
            raise RuntimeError(f"Graph export failed: {exc}") from exc


# Singleton instance
rag_engine = RAGEngine()
