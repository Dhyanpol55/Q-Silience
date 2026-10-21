import sys
import uvicorn

def main():
    """
    Entrypoint wrapper for uvicorn that handles when Render or a process
    invokes `app --host 0.0.0.0 --port $PORT`.
    """
    args = sys.argv[1:]
    # Prepend 'main:app' if not already provided
    if not any(arg.startswith("main:") for arg in args):
        args = ["main:app"] + args
    uvicorn.main(args=args)

if __name__ == "__main__":
    main()
