import os
import sys
import subprocess
import time
import webbrowser

def main():
    root_dir = os.path.dirname(os.path.abspath(__file__))
    backend_dir = os.path.join(root_dir, "backend")
    frontend_dir = os.path.join(root_dir, "frontend")
    
    print("=" * 60)
    print("  VOLTAIC AI: Energy Demand Predictor & Peak Optimizer")
    print("  PS-3Y-07: Affordable & Clean Energy (SDG 7)")
    print("=" * 60)
    print("\nStarting FastAPI Backend on http://127.0.0.1:8000...")
    
    env = os.environ.copy()
    env["PYTHONPATH"] = root_dir
    
    backend_proc = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "backend.main:app", "--host", "127.0.0.1", "--port", "8000"],
        cwd=root_dir,
        env=env
    )
    
    time.sleep(2)
    print("Starting Vite Frontend on http://localhost:5173...")
    
    # Use shell=True for npm command on Windows
    frontend_proc = subprocess.Popen(
        ["npm", "run", "dev"],
        cwd=frontend_dir,
        shell=True
    )
    
    time.sleep(2)
    url = "http://localhost:5173"
    print(f"\n[OK] Full Stack Application running!")
    print(f" -> Frontend Dashboard: {url}")
    print(f" -> Backend API Docs:  http://127.0.0.1:8000/docs")
    print("\nOpening browser in 3 seconds... Press Ctrl+C to terminate both servers.")
    
    try:
        webbrowser.open(url)
        backend_proc.wait()
        frontend_proc.wait()
    except KeyboardInterrupt:
        print("\nShutting down servers...")
        backend_proc.terminate()
        frontend_proc.terminate()
        print("Goodbye!")

if __name__ == "__main__":
    main()
