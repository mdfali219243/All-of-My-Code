def main():
    guess = get_guess()
    print(guess)

def get_guess():
    guess = int(input("Guess the number: "))

    if guess == 50:
        print("Correct!")
    else:
        print("Incorrect")
    return guess


main()
