def main():
    n = int(input("What's n? "))
    print_square(n)


def print_square(size):
    for _ in range(size):
        print("#" * size)

main()
