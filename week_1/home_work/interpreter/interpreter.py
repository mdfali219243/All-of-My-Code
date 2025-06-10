def main():
    expression = input("Expression: ")
    x, y, z = (expression.split(" "))
    result = math(x, y, z)
    print(result)

def math(x, operator, z):
    x = float(x)
    z = float(z)
    if operator == "+":
        return x + z
    elif operator == "-":
        return x - z
    elif operator == "*":
        return x * z
    elif operator == "/":
            return x / z
main()
