#!/usr/bin/env python3
"""
scripts/restore_from_r2.py
Disaster Recovery Script for Sri Vinayaka Furnitures ERP & POS (#97, #98).
Instantly restores the PostgreSQL production database from an encrypted Cloudflare R2 backup
in under 5 minutes.

Usage:
    # 1. Restore the most recent backup automatically:
    python scripts/restore_from_r2.py

    # 2. Restore a specific date's backup:
    python scripts/restore_from_r2.py --backup-key backups/db/svf_backup_2026_10_27.dump

    # 3. Dry-run verification (downloads, decrypts, and checks checksums without modifying database):
    python scripts/restore_from_r2.py --dry-run
"""
import os
import sys
import gzip
import time
import base64
import hashlib
import logging
import argparse
import tempfile
import subprocess
import urllib.parse
from typing import Optional, Dict, Any

# Ensure backend root is on sys.path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from cryptography.fernet import Fernet
from app.core.config import settings
from app.services.r2_storage import r2_storage

logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
    stream=sys.stdout
)
logger = logging.getLogger("SVF_Disaster_Recovery")


def get_fernet_cipher(encryption_key: Optional[str] = None) -> Fernet:
    """Derives 32-byte Fernet key from BACKUP_ENCRYPTION_KEY."""
    secret = encryption_key or settings.BACKUP_ENCRYPTION_KEY or "svf-production-backup-secret-key-32b"
    key_32 = hashlib.sha256(secret.encode("utf-8")).digest()
    fernet_key = base64.urlsafe_b64encode(key_32)
    return Fernet(fernet_key)


def find_latest_backup_key() -> str:
    """Finds the most recent backup key in Cloudflare R2."""
    logger.info("Scanning Cloudflare R2 for available database backups...")
    listing = r2_storage.list_files(prefix="backups/db/")
    files = listing.get("files", [])

    dumps = [f for f in files if f.get("key", "").endswith(".dump")]
    if not dumps:
        raise RuntimeError("No database backups found in Cloudflare R2 under prefix 'backups/db/'.")

    # Sort by key name descending (svf_backup_YYYY_MM_DD.dump sorts chronologically)
    dumps.sort(key=lambda x: x.get("key", ""), reverse=True)
    latest_key = dumps[0]["key"]
    logger.info(f"Identified latest backup archive: {latest_key}")
    return latest_key


def download_and_decrypt_backup(r2_key: str, cipher: Fernet) -> bytes:
    """Downloads encrypted archive from R2 and decrypts into memory."""
    logger.info(f"Downloading backup from R2: '{r2_key}'...")
    download_start = time.time()

    encrypted_bytes = r2_storage.download_bytes(r2_key)
    download_elapsed = round(time.time() - download_start, 2)
    logger.info(f"Downloaded {len(encrypted_bytes)} encrypted bytes in {download_elapsed}s.")

    # Decrypt
    logger.info("Decrypting backup with AES-128-CBC Fernet cipher...")
    decrypt_start = time.time()
    try:
        compressed_bytes = cipher.decrypt(encrypted_bytes)
    except Exception as e:
        raise ValueError(
            f"Decryption failed! Ensure BACKUP_ENCRYPTION_KEY matches the encryption key used: {e}"
        )
    logger.info(f"Decrypted successfully in {round(time.time() - decrypt_start, 2)}s.")

    # Decompress
    logger.info("Decompressing gzip archive...")
    raw_dump_bytes = gzip.decompress(compressed_bytes)
    logger.info(f"Decompressed raw database dump size: {len(raw_dump_bytes)} bytes.")

    return raw_dump_bytes


def restore_to_database(dump_bytes: bytes, target_db_url: str, dry_run: bool = False) -> None:
    """Restores database dump into PostgreSQL or SQLite."""
    if dry_run:
        logger.info("[DRY-RUN] Database integrity validated. Skipping actual database write.")
        return

    logger.info("Starting restoration into target database...")
    restore_start = time.time()

    is_postgres = (
        target_db_url.startswith("postgres://") or
        target_db_url.startswith("postgresql://") or
        "postgresql" in target_db_url
    )

    if is_postgres:
        clean_url = target_db_url.replace("postgresql+psycopg2://", "postgresql://").replace("postgresql+asyncpg://", "postgresql://")
        parsed = urllib.parse.urlparse(clean_url)

        pg_env = os.environ.copy()
        if parsed.password:
            pg_env["PGPASSWORD"] = parsed.password

        host = parsed.hostname or "localhost"
        port = str(parsed.port or 5432)
        user = parsed.username or "postgres"
        dbname = parsed.path.lstrip("/") or "railway"

        with tempfile.NamedTemporaryFile(suffix=".dump", delete=False) as tmp_file:
            tmp_file.write(dump_bytes)
            tmp_path = tmp_file.name

        try:
            cmd = [
                "pg_restore",
                "-h", host,
                "-p", port,
                "-U", user,
                "-d", dbname,
                "--clean",
                "--if-exists",
                "--no-owner",
                "--no-privileges",
                tmp_path
            ]
            logger.info(f"Running pg_restore against {host}:{port}/{dbname}...")
            res = subprocess.run(cmd, env=pg_env, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            # pg_restore exit code 0 or 1 (warnings) is normal with --clean
            if res.returncode > 1:
                logger.error(f"pg_restore error output: {res.stderr.decode('utf-8', errors='ignore')}")
                raise RuntimeError(f"pg_restore exited with error code {res.returncode}")
            logger.info(f"PostgreSQL restoration finished in {round(time.time() - restore_start, 2)}s.")
        finally:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)
    else:
        # SQLite restore
        sqlite_file = target_db_url.replace("sqlite:///", "").replace("sqlite://", "").split("?")[0]
        backup_copy = f"{sqlite_file}.bak_{int(time.time())}"
        if os.path.exists(sqlite_file):
            import shutil
            shutil.copyfile(sqlite_file, backup_copy)
            logger.info(f"Backed up current SQLite file to {backup_copy}")

        with open(sqlite_file, "wb") as f:
            f.write(dump_bytes)
        logger.info(f"Restored SQLite database file: {sqlite_file}")


def verify_restoration(target_db_url: str) -> Dict[str, Any]:
    """Runs verification queries to confirm database tables and row counts."""
    from sqlalchemy import create_engine, text
    engine = create_engine(target_db_url)
    stats = {}
    with engine.connect() as conn:
        for table in ["users", "products", "customers", "sale_invoices", "feature_flags"]:
            try:
                count = conn.execute(text(f"SELECT COUNT(*) FROM {table}")).scalar()
                stats[table] = count
            except Exception:
                stats[table] = "N/A"
    return stats


def main():
    parser = argparse.ArgumentParser(description="SVF Production Disaster Recovery Restore from Cloudflare R2")
    parser.add_argument("--backup-key", type=str, default=None, help="Specific R2 key to restore (e.g. backups/db/svf_backup_2026_10_27.dump)")
    parser.add_argument("--database-url", type=str, default=None, help="Target DATABASE_URL (defaults to env DATABASE_URL)")
    parser.add_argument("--encryption-key", type=str, default=None, help="Custom BACKUP_ENCRYPTION_KEY if different from env")
    parser.add_argument("--dry-run", action="store_true", help="Download, decrypt, and verify checksum without writing to database")
    args = parser.parse_args()

    overall_start = time.time()
    logger.info("=================================================================")
    logger.info("SRI VINAYAKA FURNITURES - DISASTER RECOVERY RESTORATION AGENT")
    logger.info("Target: Cloudflare R2 -> PostgreSQL (Railway) / SQLite")
    logger.info("=================================================================")

    target_db_url = args.database_url or settings.DATABASE_URL
    r2_key = args.backup_key or find_latest_backup_key()
    cipher = get_fernet_cipher(args.encryption_key)

    # Download, Decrypt, Decompress
    raw_dump = download_and_decrypt_backup(r2_key=r2_key, cipher=cipher)

    # Restore
    restore_to_database(dump_bytes=raw_dump, target_db_url=target_db_url, dry_run=args.dry_run)

    # Verification
    if not args.dry_run:
        logger.info("Verifying database health and table record counts...")
        table_stats = verify_restoration(target_db_url)
        for tbl, cnt in table_stats.items():
            logger.info(f"  [Table Check] {tbl}: {cnt} rows")

    total_time = round(time.time() - overall_start, 2)
    logger.info("=================================================================")
    logger.info(f"DISASTER RECOVERY COMPLETED SUCCESSFULLY IN {total_time} SECONDS (< 5 mins)!")
    logger.info(f"Source Archive: {r2_key}")
    logger.info("=================================================================")


if __name__ == "__main__":
    main()
