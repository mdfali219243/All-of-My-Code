def main():
    names = ["Mario", "Luigi", "Daisy", "Yoshi"]
    invitor = input("Who do you wanna invites? ")
    names.append(invitor)
    for name in names:
        print(write_letter(name, "Princess Peach"))


def write_letter(receiver, sender):
    return f"""
    +~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~+
       Dear {receiver},

       You are cordially invited to a ball at
       Peach's Castle this evening, 7:00 PM.

       Sincerely,
       {sender}
    +~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~+
    """


main()













def main():
    grocery = {}  # Dictionary to store item counts
    while True:
        try:
            item = input().upper()  # Convert input to uppercase
            if item in grocery:
                grocery[item] += 1  # Increment count for existing item
            else:
                grocery[item] = 1  # Initialize count for new item
            print(f"{grocery[item]} {item}")  # Print current count and item
        except EOFError:
            print()
            break
