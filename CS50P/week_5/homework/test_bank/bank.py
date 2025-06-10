def main():
    user_input = input("Greeting: ")
    print(f"${value(user_input)}")

def value(input):
    input = input.lower().strip()
    if "hello" in input:
        return 0
    elif input.startswith("h"):
        return 20
    else:
        return 100

if __name__ == "__main__":
    main()
