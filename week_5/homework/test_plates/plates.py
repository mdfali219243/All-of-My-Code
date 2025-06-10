import sys
def main():
    plate = input("Plate: ")
    if is_valid(plate):
        print("Valid")
        sys.exit(0)
    else:
        print("Invalid")
        sys.exit(1)

def is_valid(s):
    # Rule 1: Length between 2 and 6
    if len(s) < 2 or len(s) > 6:
        return False

    # Rule 2: All characters must be letters or digits
    if not s.isalnum():
        return False

    # Rule 3: First two characters must be letters
    if not s[:2].isalpha():
        return False
    if not s[:2].isupper():
        return False


    # Rule 4: Digits must be at the end, and can't start with 0
    saw_number = False
    for char in s:
        if char.isdigit():
            if not saw_number:
                if char == '0':
                    return False
                saw_number = True
        elif saw_number:  # letter comes after a digit
            return False

    return True


if __name__ == "__main__":
    main()

