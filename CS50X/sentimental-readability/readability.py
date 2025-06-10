from cs50 import get_string


def main():
    # asking user for the text
    text = get_string("Text: ")

    # counting letter
    letters = count_letter(text)

    # counting word
    words = count_word(text)

    # counting sentence
    sentences = count_sentences(text)

    # letter avarage
    L = float(letters / words) * 100
    # sentence avarge
    S = float(sentences / words) * 100
    index = round(0.0588 * L - 0.296 * S - 15.8)

    if (index < 1):
        print("Before Grade 1")

    elif (index >= 16):
        print("Grade 16+")

    else:
        print(f"Grade {index}")


# counting letter function
def count_letter(text):
    letter = 0
    for l in text:
        if l.isalpha():
            letter += 1
    return letter

# countting word function


def count_word(text):
    word = 0
    t = text.split()
    for w in t:
        word += 1
    return word


def count_sentences(text):
    sentence = 0
    for s in text:
        if s == '.' or s == '!' or s == '?':
            sentence += 1
    return sentence


main()
