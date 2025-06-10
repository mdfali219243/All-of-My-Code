month_name = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December"
]
def main():

    while True:
        time = (input("Date: "))
        if "/" in time:
            try:
                month, day, year = map(int, time.split("/"))
                if 1 <= month <= 12 and 1 <= day <= 31:
                    print(f"{year:04}-{month:02}-{day:02}")
                    return
            except ValueError:
                pass
        else:
            try:
                parts = time.split(" ")
                if len(parts) == 3 and parts[0] in month_name and parts[2].isdigit():
                    if not parts[1].endswith(","):
                        continue
                month_latter = parts[0]
                day = int(parts[1].rstrip(","))
                year = int(parts[2])
                if month_latter in month_name and 1 <= day <= 31:
                    # Convert month name to a number
                    month = month_name.index(month_latter) + 1
                    print(f"{year:04}-{month:02}-{day:02}")
                    return
            except (ValueError, IndexError):
                pass



main()
