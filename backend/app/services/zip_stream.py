"""Bounded-memory, uncompressed ZIP streaming for mixed file batches."""
import os
import zipfile
from collections.abc import AsyncIterator, Iterable


async def stream_zip_entries(storage, entries: Iterable[tuple[str, str]]) -> AsyncIterator[bytes]:
    # An unseekable sink makes zipfile emit data descriptors, allowing
    # each chunk to be sent immediately without retaining earlier bytes.
    class Sink:
        def __init__(self):
            self.pending: list[bytes] = []
            self.offset = 0

        def write(self, data):
            if data:
                self.pending.append(bytes(data))
            self.offset += len(data)
            return len(data)

        def tell(self):
            return self.offset

        def flush(self):
            pass

        def drain(self):
            chunks, self.pending = self.pending, []
            return chunks

    sink = Sink()
    names: set[str] = set()
    with zipfile.ZipFile(sink, "w", compression=zipfile.ZIP_STORED, allowZip64=True) as archive:
        for original_name, key in entries:
            name = original_name
            base, ext = os.path.splitext(original_name)
            suffix = 2
            while name in names:
                name = f"{base}_{suffix}{ext}"
                suffix += 1
            names.add(name)
            with archive.open(name, "w", force_zip64=True) as target:
                for data in sink.drain():
                    yield data
                async for chunk in storage.download(key):
                    target.write(chunk)
                    for data in sink.drain():
                        yield data
            for data in sink.drain():
                yield data
    for data in sink.drain():
        yield data

