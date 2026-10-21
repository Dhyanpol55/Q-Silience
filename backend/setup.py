from setuptools import setup

setup(
    name="q-resilience-backend",
    version="1.0.0",
    py_modules=["main", "cli"],
    entry_points={
        "console_scripts": [
            "app = cli:main",
        ],
    },
)
