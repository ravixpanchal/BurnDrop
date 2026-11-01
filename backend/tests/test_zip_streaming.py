import io
import unittest
import zipfile
from app.services.zip_stream import stream_zip_entries


class StreamingZipTests(unittest.IsolatedAsyncioTestCase):
    async def test_starts_before_storage_is_read_and_preserves_files(self):
        reads = []
        files = {'a': b'hello', 'b': b'\x00\xff\x01', 'c': b'last'}
        class Storage:
            async def download(self, key):
                reads.append(key)
                yield files[key][:1]
                yield files[key][1:]
        stream = stream_zip_entries(Storage(), [('notes.txt', 'a'), ('notes.txt', 'b'), ('notes_2.txt', 'c')])
        header = await anext(stream)
        self.assertTrue(header.startswith(b'PK'))
        self.assertEqual(reads, [])
        payload = header + b''.join([chunk async for chunk in stream])
        with zipfile.ZipFile(io.BytesIO(payload)) as archive:
            self.assertEqual(len(set(archive.namelist())), 3)
            self.assertEqual([archive.read(n) for n in archive.namelist()], list(files.values()))
            self.assertIsNone(archive.testzip())

    async def test_storage_failure_does_not_look_like_success(self):
        class Storage:
            async def download(self, key):
                yield b'partial'
                raise IOError('storage disconnected')
        with self.assertRaisesRegex(IOError, 'storage disconnected'):
            _ = [chunk async for chunk in stream_zip_entries(Storage(), [('a.txt', 'a')])]
