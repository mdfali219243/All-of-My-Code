import emoji

def main():
    user_input = input("Input: ")
    if ":" in user_input:
        output = emoji.emojize(user_input, language ='alias')
        print(f"Output: {output}")
    else:
        print("opps, you forgot to print ':'")

main()
