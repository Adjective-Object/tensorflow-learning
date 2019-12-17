from pathlib import Path
import os, sys
import imageio

dir_to_scan = sys.argv[1] if len(sys.argv) > 1 else "data"
print("scanning", dir_to_scan)

for filename in Path(dir_to_scan).rglob("*.png"):
    try:
        print("\33[2Kcheck", filename, end="\r")
        imageio.imread(filename)
    except KeyboardInterrupt:
        exit(1)
    except:
        print("deleting", filename)
        os.remove(filename)

