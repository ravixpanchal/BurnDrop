# Transfer behavior and deployment checks

Uploads display real browser transfer progress across the entire batch, bytes sent,
average speed, and an estimated remaining time. The preparation stage remains at
0% until bytes start moving. At 100%, the server may still need to confirm storage
and create the sharing code; the interface labels this stage separately.

S3 uploads use presigned URLs and a pool of four concurrent requests. Progress is
weighted by bytes, not file count. Cancelling or failing a direct transfer aborts
other active transfers instead of uploading the batch again through the API.

Single-file downloads use the existing direct S3 redirect when available. Selecting
Download all for a one-file share now uses that same path. Multi-file ZIP downloads
stream as uncompressed ZIP entries, avoiding whole-share buffering and server-side
compression before the first byte. This reduces preparation time and memory use;
ZIPs can be larger than compressed archives, especially for text-heavy batches.
The native browser Downloads panel owns download progress, including direct cloud
transfers. The page does not buffer a potentially 1 GB download into a browser Blob.

## Deployment

Deploy both frontend and backend to activate these changes. A frontend-only deploy
will not enable streamed ZIP downloads. Keep API and storage in nearby regions.
If the API hosting plan sleeps, an always-on instance is needed to remove startup
waits; frontend code cannot remove those waits.

The public frontend uses `https://burndrop-backend.onrender.com` by default. Set
`NEXT_PUBLIC_API_URL` to the intended reachable API host before building. If using
same-origin API requests instead, configure `BACKEND_INTERNAL_URL` to a publicly
reachable backend address on Vercel; Docker hostnames only work inside Docker.

For direct S3 uploads, bucket CORS must allow PUT from the frontend origin and all
required request headers. No bucket policy or infrastructure settings were changed
by this patch. Validate with a disposable batch of mixed files after deployment,
then compare transfer time separately from API startup and share-finalization time.

## Focused regression checks

From the project root:

```sh
node --test frontend/tests/upload-transfer.test.cjs
```

From backend:

```sh
PYTHONPATH=. python3 -m unittest discover -s tests -p test_zip_streaming.py
```
