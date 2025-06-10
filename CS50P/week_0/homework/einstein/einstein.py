def main():
    e = einstein(int(input("m: ")))
    print(e)

def einstein(e):
    e = e * square(300000000)
    return e

def square(n):
    return n * n
main()

