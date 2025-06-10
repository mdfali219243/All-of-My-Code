import sys
from csv import DictReader
from tabulate import tabulate

# Check number of arguments
if len(sys.argv) > 2:
    sys.exit("Too many command-line arguments")
elif len(sys.argv) < 2:
    sys.exit("Too few command-line arguments")
elif not sys.argv[1].endswith(".csv"):
    sys.exit("Not a CSV file")

# Try opening the file
try:
    with open(sys.argv[1], "r") as file:
        reader = DictReader(file)
        print(tabulate(list(reader), headers="keys", tablefmt="grid"))
except FileNotFoundError:
    sys.exit("File does not exist")
