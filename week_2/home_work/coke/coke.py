money = 50

def main():
    global money
    while money > 0:
        user_input = int(input("Insert Coin: "))
        money_due = amount_due(user_input)
        print(f"Amount Due: {money_due}")
    change_owed()

def change_owed():
    print(f"Change Owed: {abs(money)}")

def amount_due(n):
    global money
    if n == 25 or n == 10 or n == 5:
        money -= n
    return abs(money)

main()
