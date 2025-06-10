from hello import hello

def test_argument():
    assert hello("David") == "hello, David"

def test_default():
    assert hello() == "hello, world"
