import sys

# Check number of arguments
if len(sys.argv) > 2:
    sys.exit("Too many command-line arguments")
elif len(sys.argv) < 2:
    sys.exit("Too few command-line arguments")
elif not sys.argv[1].endswith(".py"):
    sys.exit("Not a Python file")

# Try opening the file
try:
    with open(sys.argv[1]) as file:
        lines = file.readlines()

    # Count lines of code
    count = 0
    for line in lines:
        stripped = line.lstrip()
        if stripped == "" or stripped.startswith("#"):
            continue
        count += 1

    print(count)

except FileNotFoundError:
    sys.exit("File does not exist")
