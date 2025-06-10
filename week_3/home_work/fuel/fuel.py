def main():
    x, y = get_input("Fraction: ")
    result(x , y)


def get_input(f):
    x , y = 0, 1
    while True:
        try:
            k = input(f)
            x, y = k.split("/")
            x = int(x)
            y = int(y)
            # Check for valid fraction
            if y == 0 or y < x:
                continue
            break
        except (ValueError, ZeroDivisionError):
            continue
    return x , y

def result(x, y):
    percentage = round((x / y) * 100)
    if percentage <= 1:
        print("E")
    elif percentage >= 99:
        print("F")
    else:
        print(f"{percentage}%")
main()
