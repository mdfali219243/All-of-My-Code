def main():
    greeting = input("What do you wanna say? ")
    greeting = greet(greeting)
    print(greeting)


def greet(input):
    if "hello" in input:
        return("Hello, there")
    else:
        return("I am not sure what you mean")
main()
