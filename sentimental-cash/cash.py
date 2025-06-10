from cs50 import get_float


def main():
    while True:
        cents = get_float("Change: ")
        if (cents < 0):
            pass
        else:
            break
    cents = round(cents * 100)
    quarters = calculate_quartes(cents)
    cents = cents - (quarters * 25)
    dimes = cents // 10
    cents = cents - (dimes * 10)
    nickels = cents // 5
    cents = cents - (nickels * 5)
    pennies = cents // 1

    total_coins = quarters + dimes + nickels + pennies
    print(total_coins)


def calculate_quartes(cents):
    return cents // 25


if __name__ == "__main__":
    main()
