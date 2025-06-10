import random

def main():
    # Prompt the user for a valid level
    while True:
        try:
            level = int(input("Level: "))
            if level < 1:
                continue
            break
        except ValueError:
            continue

    # Generate the random number
    number = random.randint(1, level)  # Include the upper bound

    # Start guessing loop
    while True:
        try:
            guess = int(input("Guess: "))

            if guess > number:
                print("Too large!")
            elif guess < number:
                print("Too small!")
            else:
                print("Just right!")
                break
        except ValueError:
            print("Invalid input. Please enter an integer.")

if __name__ == "__main__":
    main()

