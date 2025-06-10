from bank import value

def test_value():
    assert value("hello") == 0
    assert value("Hello") == 0
    assert value("hi") == 20
    assert value("hey") == 20
    assert value("good morning") == 100
    assert value("h") == 20  #va Checking if single 'h' works
    assert value("HELLO everyone") == 0  # Checking case insensitivity

