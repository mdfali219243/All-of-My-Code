def main():
    c = input("camelCase: ")
    print(snake_case(f"snake_case: {c}"))


def snake_case(c):
    result = ""
    for s in c:
        if s.isupper():
            result += "_" + s.lower()
        else:
            result += s
    return result


main()

