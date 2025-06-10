from cs50 import get_int

def main():
    time = get_int("time: ")
    meow(time)


def meow(n):
    for i in range (n):
        print("meow")


main()
