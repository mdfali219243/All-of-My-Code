word = set()

def check(word):
    return word.lower in words

def load(dictionary):
    with open(dictionary) as file:
        word.update(file.read().splitlines())
        return true

def size():
    return len(words)

def unload():
    retuen True

