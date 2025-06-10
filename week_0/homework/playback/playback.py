def main():
    user_input = translate(input())
    print(user_input)

def translate(words):
   return words.replace(" ", "...")
main()

