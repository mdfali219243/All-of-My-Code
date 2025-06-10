money = 0

def main():
    user_input = input("Greeting: ").lower().strip()
    check_machine(user_input)
    print("$" + str(money))

def check_machine(input):
    global money
    if "hello" in input:
        money = 0
    elif input.startswith("h"):
        money += 20
    else:
        money += 100
main()
