from twttr import shorten  # Import the shorten function from the main program

def test_shorten():
    assert shorten("FOysal") == "Fysl"
    assert shorten("Hello") == "Hll"

def test_error_number():
    assert shorten("hello 1") == "hll 1"

def test_punctuation_error():
    assert shorten("he,llo") == "h,ll"
    assert shorten("Hello ??") == "Hll ??"

if __name__ == "__main__":
    test_shorten()
    test_error_number()
    test_punctuation_error()
    print("All tests passed!")
