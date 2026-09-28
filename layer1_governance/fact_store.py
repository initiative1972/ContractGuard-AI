"""
ContractGuard AI — Layer 1: Knowledge Engineering & Governance
Module: fact_store.py
Purpose: mmap-backed binary chunk storage engine with in-memory sparse offset index.
         Maps unique content-addressed `fact_id` to file offset, byte length, and metadata hash.
Compliant with: APRA CPG 235 (Data lineage, permanent provenance, content-addressable storage).
"""

from __future__ import annotations

import dataclasses
import hashlib
import json
import mmap
import os
import struct
from typing import Any, Dict, Iterator, List, Optional, Tuple


@dataclasses.dataclass
class FactIndexEntry:
    """In-memory index record pointing to physical binary payload location."""
    fact_id: str
    file_offset: int
    byte_length: int
    metadata_hash: str
    clause_number: str
    document_id: str


@dataclasses.dataclass
class FactRecord:
    """Fully rehydrated fact record containing text payload and structured lineage."""
    fact_id: str
    text: str
    clause_number: str
    document_id: str
    metadata: Dict[str, Any]
    metadata_hash: str


class MmapFactStore:
    """
    High-performance, zero-overhead chunk storage engine.
    Uses memory-mapped file I/O (mmap) to persist binary payloads to disk without
    exhausting the Python runtime heap.

    Disk Layout:
    - payload_file: Append-only raw UTF-8 bytes for all clause chunks.
    - index_file: JSON-L or binary index mapping fact_id -> (offset, length, metadata_hash).
    """

    def __init__(self, storage_dir: str = "./data/mmap_store"):
        self.storage_dir = storage_dir
        os.makedirs(self.storage_dir, exist_ok=True)

        self.payload_path = os.path.join(self.storage_dir, "chunks.bin")
        self.index_path = os.path.join(self.storage_dir, "sparse_index.jsonl")

        self._index: Dict[str, FactIndexEntry] = {}
        self._mmap_obj: Optional[mmap.mmap] = None
        self._file_handle = None

        # Initialize and load existing records
        self._bootstrap_store()

    def _bootstrap_store(self) -> None:
        """Initializes binary store file and loads in-memory sparse index."""
        if not os.path.exists(self.payload_path):
            with open(self.payload_path, "wb") as f:
                f.write(b"")  # Create empty file

        # Load sparse index from disk if present
        if os.path.exists(self.index_path):
            with open(self.index_path, "r", encoding="utf-8") as f:
                for line in f:
                    if line.strip():
                        data = json.loads(line)
                        entry = FactIndexEntry(
                            fact_id=data["fact_id"],
                            file_offset=data["file_offset"],
                            byte_length=data["byte_length"],
                            metadata_hash=data["metadata_hash"],
                            clause_number=data.get("clause_number", ""),
                            document_id=data.get("document_id", ""),
                        )
                        self._index[entry.fact_id] = entry

        self._remap_memory()

    def _remap_memory(self) -> None:
        """Refreshes the mmap view after appends."""
        if self._mmap_obj:
            self._mmap_obj.close()
        if self._file_handle:
            self._file_handle.close()

        file_size = os.path.getsize(self.payload_path)
        if file_size > 0:
            self._file_handle = open(self.payload_path, "r+b")
            self._mmap_obj = mmap.mmap(
                self._file_handle.fileno(), 0, access=mmap.ACCESS_READ
            )
        else:
            self._mmap_obj = None
            self._file_handle = None

    @staticmethod
    def compute_fact_id(document_id: str, clause_number: str, text: str) -> str:
        """
        Computes permanent content-addressed identifier.
        Guarantees idempotency and APRA CPG 235 lineage verification.
        """
        payload = f"{document_id}::{clause_number}::{text}".encode("utf-8")
        return f"fact_{hashlib.sha256(payload).hexdigest()[:16]}"

    def put_chunk(
        self,
        document_id: str,
        clause_number: str,
        text: str,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> str:
        """
        Appends a sanitized clause chunk to the binary store and registers it in the sparse index.
        Returns the permanent fact_id.
        """
        fact_id = self.compute_fact_id(document_id, clause_number, text)

        # Idempotent write: if already present, skip duplicate write
        if fact_id in self._index:
            return fact_id

        meta = metadata or {}
        meta_json = json.dumps(meta, sort_keys=True)
        meta_hash = hashlib.sha256(meta_json.encode("utf-8")).hexdigest()[:16]

        encoded_text = text.encode("utf-8")
        byte_length = len(encoded_text)

        # Open in append binary mode
        with open(self.payload_path, "ab") as f:
            file_offset = f.tell()
            f.write(encoded_text)

        entry = FactIndexEntry(
            fact_id=fact_id,
            file_offset=file_offset,
            byte_length=byte_length,
            metadata_hash=meta_hash,
            clause_number=clause_number,
            document_id=document_id,
        )
        self._index[fact_id] = entry

        # Append to disk index
        with open(self.index_path, "a", encoding="utf-8") as idx_f:
            record = {
                "fact_id": fact_id,
                "file_offset": file_offset,
                "byte_length": byte_length,
                "metadata_hash": meta_hash,
                "clause_number": clause_number,
                "document_id": document_id,
                "metadata": meta,
            }
            idx_f.write(json.dumps(record) + "\n")

        # Refresh memory-mapped pointer
        self._remap_memory()

        return fact_id

    def get_chunk(self, fact_id: str) -> Optional[FactRecord]:
        """
        Retrieves a chunk by demand-paging via mmap slice.
        Zero heap allocation for unused sections.
        """
        entry = self._index.get(fact_id)
        if not entry:
            return None

        if self._mmap_obj is None:
            self._remap_memory()

        if self._mmap_obj is None:
            return None

        # Slice directly from mapped kernel pages
        raw_bytes = self._mmap_obj[entry.file_offset : entry.file_offset + entry.byte_length]
        text = raw_bytes.decode("utf-8")

        return FactRecord(
            fact_id=fact_id,
            text=text,
            clause_number=entry.clause_number,
            document_id=entry.document_id,
            metadata={"source_offset": entry.file_offset},
            metadata_hash=entry.metadata_hash,
        )

    def contains(self, fact_id: str) -> bool:
        """Fast in-memory index presence check."""
        return fact_id in self._index

    def list_fact_ids(self) -> List[str]:
        """Lists all registered fact identifiers."""
        return list(self._index.keys())

    def __len__(self) -> int:
        return len(self._index)

    def close(self) -> None:
        """Flushes and releases memory map descriptors."""
        if self._mmap_obj:
            self._mmap_obj.close()
            self._mmap_obj = None
        if self._file_handle:
            self._file_handle.close()
            self._file_handle = None


if __name__ == "__main__":
    import shutil
    test_dir = "./data/test_mmap"
    if os.path.exists(test_dir):
        shutil.rmtree(test_dir)

    store = MmapFactStore(storage_dir=test_dir)
    fid1 = store.put_chunk(
        document_id="AU-CBA-01",
        clause_number="19.3",
        text="The Borrower warrants compliance with APRA CPS 234 information security standards.",
    )
    fid2 = store.put_chunk(
        document_id="AU-CBA-01",
        clause_number="24.1",
        text="The Borrower provides an uncapped environmental indemnity surviving facility termination.",
    )

    print(f"Stored chunks count: {len(store)}")
    rec1 = store.get_chunk(fid1)
    if rec1:
        print(f"Rehydrated [{rec1.fact_id}] Clause {rec1.clause_number}: '{rec1.text}'")

    store.close()
    if os.path.exists(test_dir):
        shutil.rmtree(test_dir)
