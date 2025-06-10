from check_plates import is_valid
from datetime import date
import sys
import csv

def main():
    # This is where our file name is
    file_path = "records.csv"

    # asking for user input
    speed = int(input("Speed: "))
    plate = input("Plate: ")

    #checking is the plate valid
    if is_valid(plate):
        print("Good")
    else:
        print("############################")
        print("#   ❌ INVALID PLATE!     #")
        print("#   Please try again.     #")
        print("############################")
        sys.exit()

    # checking the date validity

    date_str = input("Date (YYYY-MM-DD): ")

    #checking if the date is good
    date_obj = check_date(date_str)

    # Write the new record: [date, plate, speed]
    write_record(file_path, [date_obj.isoformat(), plate, speed])

    # Count how many times this plate has been recorded
    count = get_record_count(file_path, plate, date_obj)

    # Give warning or ticket
    if count < 5:
        print("\n" + "*" * 40)
        print(f"*  ⚠️ WARNING: Plate {plate}  ")
        print(f"*  has been caught speeding {count} time(s) this week.")
        print("*  Drive safely or you may get a ticket.")
        print("*" * 40)
    else:
        print("\n" + "#" * 45)
        print(f"#  🚨 TICKET ISSUED: Plate {plate}  ")
        print(f"#  {count} speeding offenses this week!")
        print("#  Report has been filed for further action.")
        print("#" * 45)



def check_date(date_str):
    # Validate the date format (e.g., YYYY-MM-DD)
    try:
        day = date.fromisoformat(date_str)
    except ValueError:
        raise ValueError("Invalid date format")
    return day


def write_record(file_path, record):
    with open(file_path, mode='a', newline='') as file:
        writer = csv.writer(file)
        writer.writerow(record)

def read_records(file_path):
    records = []
    with open(file_path, mode='r') as file:
        reader = csv.reader(file)
        for row in reader:
            records.append(row)
    return records


# Check if a record exists for the given plate
def record_exists(file_path, plate):
    records = read_records(file_path)
    for record in records:
        if record[1] == plate:  # Assuming plate is the second column
            return True
    return False

# Checking records for a specific plate, if its in same week
def get_record_count(file_path, plate, current_date):
    records = read_records(file_path)
    count = 0
    current_year, current_week, _ = current_date.isocalendar()
    for record in records:
        record_plate = record[1]
        try:
            record_date = date.fromisoformat(record[0])
        except ValueError:
            continue  # skip invalid dates
        record_year, record_week, _ = record_date.isocalendar()
        if record_plate == plate and record_year == current_year and record_week == current_week:
            count += 1
    return count


if __name__ == "__main__":
    main()
