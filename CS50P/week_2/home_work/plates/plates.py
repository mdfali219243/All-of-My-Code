def main():
    plate = input("Plate: ")
    if is_valid(plate):
        print("Valid")
    else:
        print("Invalid")

def is_valid(s):
    if len(s) < 2 or len(s) > 6:
        return False
    if not s.isalnum():
        return False
    if s[0].isdigit() or s[1].isdigit():
        return False

    for i in range(len(s)):
        if s[i].isdigit():
            if s[i] == '0':
                return False
            if not s[i:].isdigit():
                return False
            break

    return True


if __name__ == "__main__":
    main()
