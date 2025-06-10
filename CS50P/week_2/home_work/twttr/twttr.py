def main():
    Input = input("Input: ")
    print(f"Output: {output(Input)}")

    
def output(input):
    vowels = "aeiouAEIOU"
    result = ""
    for i in input:
        if i not in vowels:
            result += i
    return result
main()
