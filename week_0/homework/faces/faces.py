def main():
    user_input = responce(input())
    print(user_input)

def responce(words):
    if ":)" in words:
        words = words.replace(":)", "🙂")
    if ":(" in words:
        words = words.replace(":(", "🙁")
    return words
main()
