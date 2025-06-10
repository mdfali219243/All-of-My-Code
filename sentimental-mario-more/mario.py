# we take the get_int function from the cs50 libary
from cs50 import get_int

while True:  # we make a loop
    n = get_int("Hight: ")
    if (n > 1 and n < 8):
        break
    else:
        pass


def main():
    for i in range(n):
        length(n - i - 1, i + 1, i + 1)

# length is function that took argument as space and length


def length(space, left_pyramid, right_pyramid):
    for j in range(space):  # it is for for every space
        print(" ", end="")

    for i in range(left_pyramid):  # hash
        print("#", end="")

    for d in range(2):  # it is for for every space
        print(" ", end="")

    for f in range(right_pyramid):
        print("#", end="")
    print()


main()
