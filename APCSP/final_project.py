import random


def main():
    print("Welcome to the game of math")
    print("Choose level 1 to 3")
    print("Lets see what's you got? There Will be 10 question")
    problems = []
    level = get_level()
    score = 0
    for _ in range(10):  # 10 problems
        x = generate_integer(level)
        y = generate_integer(level)
        correct_answer = x + y
        problems.append(f"{x} + {y} = {correct_answer}")

        tries = 0

        while tries < 3:  # Allow up to 3 attempts
            try:
                user_answer = int(input(f"{x} + {y} = "))
                if user_answer == correct_answer:
                    score += 1  # Increment score if correct
                    break
                else:
                    print("EEE, you got wrong!")  # Wrong answer message
            except ValueError:
                print("EEE")  # Handle invalid input

            tries += 1  # Increment attempt count

# Show the correct answer after 3 wrong attempts
        if tries == 3:
            print(f"The correct answer is {correct_answer}")

    print(f"\nYour Score is {score}")

    print("\nHere are all the problems:")
    for problem in problems:
        print(problem)


# Check user level
def get_level():
    while True:

        try:
            n = int(input("Level: "))
            if 0 < n < 4:
                return n
        except ValueError:
            pass

# it will generate number for the quiz
def generate_integer(level):
    if level == 1:
        return random.randint(0, 9)

    elif level == 2:
        return random.randint(10, 99)

    else:
        return random.randint(100, 999)

if __name__ == "__main__":
    main()
