import sys
import csv

# Check number of arguments
if len(sys.argv) > 3:
    sys.exit("Too many command-line arguments")
elif len(sys.argv) < 3:
    sys.exit("Too few command-line arguments")
elif not sys.argv[1].endswith(".csv"):
    sys.exit("Not a Python file")

# Try opening the file
try:
    with open(sys.argv[1], "r") as input_file:
        reader = csv.DictReader(input_file)

        # Open output file for writing
        with open(sys.argv[2], "w") as output_file:
            writer = csv.DictWriter(output_file, fieldnames=["first", "last", "house"])
            writer.writeheader()

            for row in reader:
                # Split the name into last and first
                last, first = row["name"].split(", ")
                writer.writerow({
                    "first": first,
                    "last": last,
                    "house": row["house"]
                })

except FileNotFoundError:
    sys.exit(f"Could not read {sys.argv[1]}")
