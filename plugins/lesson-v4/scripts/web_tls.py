"""One certificate check for every picture download.

Python's default check on Windows trusts the Windows certificate store of the
user running it. Inside Codex's sandbox that user's store holds an expired
root, so on 3 and 4 November 2026 every Wikimedia request from a Codex picture
worker failed with `certificate verify failed: certificate has expired`, and
the lessons fell back to generated pictures. The same request with certifi's
bundle succeeded inside the same sandbox. So downloads check against certifi's
bundle when it is installed, and against the system store only when it is not.
"""
import ssl


def make_context() -> ssl.SSLContext:
    try:
        import certifi
    except ImportError:
        return ssl.create_default_context()
    return ssl.create_default_context(cafile=certifi.where())


CONTEXT = make_context()
