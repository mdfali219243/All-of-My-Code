def main():
    time = input("What time is it? ")
    decimal_time = convert(time)
    if 7 <= decimal_time < 8:
        print("breakfast time")
    elif 12 <= decimal_time < 14:
        print("lunch time")
    elif 18 <= decimal_time < 19:
        print("dinner time")


def convert(time):
    hours, minutes = time.split(":")
    hours = float(hours)
    minutes = float(minutes)
    return hours + minutes / 60


if __name__ == "__main__":
    main()
