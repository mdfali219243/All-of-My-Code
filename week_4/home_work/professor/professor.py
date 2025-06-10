import random


def main():
    level = get_level()
    score = 0
    for _ in range(10):  # 10 problems
        x = generate_integer(level)
        y = generate_integer(level)
        correct_answer = x + y
        tries = 0

        while tries < 3:  # Allow up to 3 attempts
            try:
                user_answer = int(input(f"{x} + {y} = "))
                if user_answer == correct_answer:
                    score += 1  # Increment score if correct
                    break
                else:
                    print("EEE")  # Wrong answer message
            except ValueError:
                print("EEE")  # Handle invalid input
            tries += 1  # Increment attempt count

        if tries == 3:  # Show the correct answer after 3 wrong attempts
            print(f"The correct answer is {correct_answer}")

    print(score)


def get_level():
    while True:

        try:
            n = int(input("Level: "))
            if 0 < n < 4:
                return n
        except ValueError:
            pass

def generate_integer(level):
    if level == 1:
        return random.randint(0, 9)

    elif level == 2:
        return random.randint(10, 99)

    else:
        return random.randint(100, 999)





if __name__ == "__main__":
    main()
