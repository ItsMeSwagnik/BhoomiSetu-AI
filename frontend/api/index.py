import sys
import os

# Ensure backend directory is on sys.path
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
root_dir = os.path.dirname(parent_dir)
backend_dir = os.path.join(root_dir, "backend")

for p in [backend_dir, os.path.join(parent_dir, "backend"), current_dir]:
    abs_p = os.path.abspath(p)
    if os.path.exists(abs_p) and abs_p not in sys.path:
        sys.path.insert(0, abs_p)

from app.main import app
